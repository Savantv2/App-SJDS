import express, { type NextFunction, type Request, type Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  CURRENT_SEED_VERSION,
  createSeedDatabase,
  hashPassword,
  type LeagueDatabase,
} from './src/data/seedData';
import {
  calculateDisciplineSummary,
  calculateStandings,
  calculateTopScorers,
  computeMatchScoreFromEvents,
  parseTransferTeamLabel,
  sanitizePublicEvents,
  validatePlayerTransfer,
  validateRosterMutation,
  validateTeamStarters,
} from './src/lib/leagueEngine';
import type {
  Competition,
  EventType,
  Match,
  MatchEvent,
  MatchStatus,
  Player,
  PositionCode,
  PublicUser,
  Team,
} from './src/types/league';

const PORT = Number(process.env.PORT ?? 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'league-db.json');
const SECRET_PATH = path.join(DATA_DIR, '.session-secret');

let db: LeagueDatabase;
let sessionSecret = process.env.SESSION_SECRET ?? '';

async function initPersistence(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  if (!sessionSecret) {
    try {
      sessionSecret = (await fs.readFile(SECRET_PATH, 'utf8')).trim();
    } catch {
      sessionSecret = crypto.randomBytes(32).toString('hex');
      await fs.writeFile(SECRET_PATH, sessionSecret, 'utf8');
    }
  }

  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    db = JSON.parse(raw) as LeagueDatabase;
    if (db.seedVersion !== CURRENT_SEED_VERSION) {
      db = createSeedDatabase();
      await persistDb();
    }
  } catch {
    db = createSeedDatabase();
    await persistDb();
  }
}

async function persistDb(): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function signToken(user: PublicUser): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): { sub: string; role: string } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', sessionSecret).update(payload).digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub: string;
      role: string;
      exp: number;
    };
    if (!decoded.exp || decoded.exp < Date.now()) return null;
    return { sub: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}

interface AuthedRequest extends Request {
  authUser?: PublicUser;
}

function extractUser(req: AuthedRequest): PublicUser | undefined {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return undefined;
  const token = header.slice('Bearer '.length).trim();
  const parsed = verifyToken(token);
  if (!parsed) return undefined;
  const found = db.users.find((u) => u.id === parsed.sub);
  if (!found) return undefined;
  return {
    id: found.id,
    email: found.email,
    name: found.name,
    role: found.role,
    assignedTeamId: found.assignedTeamId,
  };
}

function attachOptionalAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  req.authUser = extractUser(req);
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const user = extractUser(req);
  if (!user) {
    res.status(401).json({ error: 'Sesión no válida o expirada. Inicia sesión nuevamente.' });
    return;
  }
  req.authUser = user;
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser || req.authUser.role !== 'admin') {
    res.status(403).json({
      error: 'Acceso denegado: esta acción requiere permisos de Administrador de Liga.',
    });
    return;
  }
  next();
}

function requireTeamAccess(req: AuthedRequest, res: Response, next: NextFunction): void {
  const user = req.authUser;
  if (!user) {
    res.status(401).json({ error: 'Autenticación requerida.' });
    return;
  }
  const { teamId } = req.params;
  if (user.role === 'admin') {
    next();
    return;
  }
  const team = db.teams.find((t) => t.id === teamId);
  if (user.role === 'dt' && (user.assignedTeamId === teamId || team?.dtUserId === user.id)) {
    next();
    return;
  }
  res.status(403).json({
    error: 'Permiso denegado: un Director Técnico solo puede administrar la plantilla y escudo de su propio equipo.',
  });
}

function buildOverview(competitionId?: string, includeInternal = false) {
  const activeCompetition =
    db.competitions.find((c) => c.id === competitionId) ??
    db.competitions.find((c) => c.status === 'active') ??
    db.competitions[0];

  const teams = db.teams.filter((t) => t.competitionId === activeCompetition.id);
  const players = db.players.filter((p) => p.competitionId === activeCompetition.id);
  const matches = db.matches.filter((m) => m.competitionId === activeCompetition.id);
  const rawEvents = db.events.filter((e) => e.competitionId === activeCompetition.id);
  const events = includeInternal ? rawEvents : sanitizePublicEvents(rawEvents);
  const pointAdjustments = db.pointAdjustments.filter((a) => a.competitionId === activeCompetition.id);
  const suspensionOverrides = db.suspensionOverrides.filter(
    (s) => s.competitionId === activeCompetition.id
  );

  const standings = calculateStandings(
    teams,
    matches,
    pointAdjustments,
    activeCompetition.rules
  );
  const scorers = calculateTopScorers(players, teams, matches, rawEvents);
  const discipline = calculateDisciplineSummary(
    players,
    teams,
    matches,
    rawEvents,
    activeCompetition.rules,
    suspensionOverrides,
    includeInternal
  );

  const publicTransfers = db.auditLogs
    .filter(
      (a) =>
        a.competitionId === activeCompetition.id &&
        a.action === 'Transferencia de jugador'
    )
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((a) => {
      const prev = parseTransferTeamLabel(a.previousValue);
      const next = parseTransferTeamLabel(a.newValue);
      return {
        id: a.id,
        playerId: a.entityId,
        previousValue: a.previousValue,
        newValue: a.newValue,
        fromTeamName: prev.teamName,
        toTeamName: next.teamName,
        fromDorsal: prev.dorsal,
        toDorsal: next.dorsal,
        reason: a.reason,
        createdAt: a.createdAt,
      };
    });

  return {
    isDemoData: db.isDemoData,
    competitions: db.competitions,
    activeCompetition,
    teams,
    players,
    matches,
    events,
    standings,
    scorers,
    discipline,
    pointAdjustments,
    publicTransfers,
    ...(includeInternal
      ? {
          auditLogs: db.auditLogs
            .filter((a) => a.competitionId === activeCompetition.id)
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        }
      : {}),
  };
}

async function startServer() {
  await initPersistence();

  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Public Overview (never returns internal notes unless valid admin token)
  app.get('/api/public/overview', attachOptionalAuth, (req: AuthedRequest, res: Response) => {
    const competitionId =
      typeof req.query.competitionId === 'string' ? req.query.competitionId : undefined;
    const isAdmin = req.authUser?.role === 'admin';
    res.json(buildOverview(competitionId, isAdmin));
  });

  // Auth routes
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user || user.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: 'Credenciales incorrectas. Verifica correo y contraseña.' });
      return;
    }

    const publicUser: PublicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      assignedTeamId: user.assignedTeamId,
    };
    const token = signToken(publicUser);
    res.json({ token, user: publicUser });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
    res.json({ user: req.authUser });
  });

  // DT & Admin: Add Player to Team
  app.post(
    '/api/teams/:teamId/players',
    requireAuth,
    requireTeamAccess,
    async (req: AuthedRequest, res: Response) => {
      const { teamId } = req.params;
      const team = db.teams.find((t) => t.id === teamId);
      if (!team) {
        res.status(404).json({ error: 'Equipo no encontrado.' });
        return;
      }

      const competition = db.competitions.find((c) => c.id === team.competitionId);
      if (!competition) {
        res.status(404).json({ error: 'Competencia no encontrada.' });
        return;
      }

      if (competition.status === 'archived') {
        res.status(400).json({ error: 'No se pueden modificar plantillas de una temporada archivada.' });
        return;
      }

      const { name, dorsal, primaryPosition, secondaryPosition } = req.body as {
        name?: string;
        dorsal?: number;
        primaryPosition?: PositionCode;
        secondaryPosition?: PositionCode;
      };

      const validPositions: PositionCode[] = ['POR', 'DEF', 'MED', 'DEL'];
      if (!primaryPosition || !validPositions.includes(primaryPosition)) {
        res.status(400).json({ error: 'Selecciona una posición principal válida.' });
        return;
      }
      if (secondaryPosition && !validPositions.includes(secondaryPosition)) {
        res.status(400).json({ error: 'La posición secundaria no es válida.' });
        return;
      }

      const teamPlayers = db.players.filter((p) => p.teamId === teamId);
      const validation = validateRosterMutation(teamPlayers, 'add', competition.rules, {
        name,
        dorsal: Number(dorsal),
      });

      if (!validation.ok) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const newPlayer: Player = {
        id: `p-${crypto.randomUUID().slice(0, 8)}`,
        teamId,
        competitionId: competition.id,
        name: name!.trim(),
        dorsal: Number(dorsal),
        primaryPosition,
        secondaryPosition: secondaryPosition && secondaryPosition !== primaryPosition ? secondaryPosition : undefined,
        status: 'active',
        joinedAt: new Date().toISOString().slice(0, 10),
      };

      db.players.push(newPlayer);
      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId: competition.id,
        action: 'Alta de jugador',
        entityType: 'player',
        entityId: newPlayer.id,
        previousValue: 'Sin registro',
        newValue: `#${newPlayer.dorsal} ${newPlayer.name} (${newPlayer.primaryPosition})`,
        reason: `Inscripción en ${team.name}`,
        actorName: req.authUser!.name,
        actorRole: req.authUser!.role,
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.status(201).json({ player: newPlayer });
    }
  );

  // DT & Admin: Update Player (Position, Dorsal, Archive / Reactivate)
  app.patch(
    '/api/teams/:teamId/players/:playerId',
    requireAuth,
    requireTeamAccess,
    async (req: AuthedRequest, res: Response) => {
      const { teamId, playerId } = req.params;
      const team = db.teams.find((t) => t.id === teamId);
      const player = db.players.find((p) => p.id === playerId && p.teamId === teamId);
      if (!team || !player) {
        res.status(404).json({ error: 'Jugador o equipo no encontrado.' });
        return;
      }

      const competition = db.competitions.find((c) => c.id === team.competitionId);
      if (!competition) {
        res.status(404).json({ error: 'Competencia no encontrada.' });
        return;
      }
      if (competition.status === 'archived') {
        res.status(400).json({ error: 'Temporada archivada: los datos históricos son de solo lectura.' });
        return;
      }

      const { dorsal, primaryPosition, secondaryPosition, status, name } = req.body as {
        dorsal?: number;
        primaryPosition?: PositionCode;
        secondaryPosition?: PositionCode | '';
        status?: 'active' | 'archived';
        name?: string;
      };

      const teamPlayers = db.players.filter((p) => p.teamId === teamId);
      const action =
        status === 'archived' && player.status === 'active'
          ? 'archive'
          : status === 'active' && player.status === 'archived'
            ? 'reactivate'
            : 'update';

      const nextDorsal = dorsal !== undefined ? Number(dorsal) : player.dorsal;
      const validation = validateRosterMutation(teamPlayers, action, competition.rules, {
        playerId: player.id,
        dorsal: action === 'archive' ? undefined : nextDorsal,
      });

      if (!validation.ok) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const previousSnapshot = `#${player.dorsal} ${player.name} · ${player.primaryPosition} · ${player.status}`;

      if (name && req.authUser!.role === 'admin') {
        player.name = name.trim();
      }
      if (dorsal !== undefined) {
        player.dorsal = Number(dorsal);
      }
      if (primaryPosition) {
        player.primaryPosition = primaryPosition;
      }
      if (secondaryPosition !== undefined) {
        player.secondaryPosition =
          secondaryPosition === '' || secondaryPosition === player.primaryPosition
            ? undefined
            : secondaryPosition;
      }
      if (status) {
        player.status = status;
        if (status === 'archived') {
          player.archivedAt = new Date().toISOString().slice(0, 10);
          if (team.starterPlayerIds) {
            team.starterPlayerIds = team.starterPlayerIds.filter((id) => id !== player.id);
          }
        } else {
          player.archivedAt = undefined;
        }
      }

      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId: competition.id,
        action:
          action === 'archive'
            ? 'Baja de jugador (Archivo histórico)'
            : action === 'reactivate'
              ? 'Reactivación de jugador'
              : 'Actualización de ficha de jugador',
        entityType: 'player',
        entityId: player.id,
        previousValue: previousSnapshot,
        newValue: `#${player.dorsal} ${player.name} · ${player.primaryPosition} · ${player.status}`,
        reason: `Actualización de plantel en ${team.name}`,
        actorName: req.authUser!.name,
        actorRole: req.authUser!.role,
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.json({ player });
    }
  );

  // Own DT Only: Transfer Player to Another Club in the Same Competition
  app.post(
    '/api/teams/:teamId/players/:playerId/transfer',
    requireAuth,
    async (req: AuthedRequest, res: Response) => {
      const { teamId, playerId } = req.params;
      const sourceTeam = db.teams.find((t) => t.id === teamId);
      const authUser = req.authUser!;
      if (
        authUser.role !== 'dt' ||
        (authUser.assignedTeamId !== teamId && sourceTeam?.dtUserId !== authUser.id)
      ) {
        res.status(403).json({
          error: 'Solo el Director Técnico de este equipo puede transferir jugadores de su plantilla.',
        });
        return;
      }

      const player = db.players.find((p) => p.id === playerId && p.teamId === teamId);
      if (!sourceTeam || !player) {
        res.status(404).json({ error: 'Jugador o equipo de origen no encontrado.' });
        return;
      }

      const competition = db.competitions.find((c) => c.id === sourceTeam.competitionId);
      if (!competition) {
        res.status(404).json({ error: 'Competencia no encontrada.' });
        return;
      }
      if (competition.status === 'archived') {
        res.status(400).json({ error: 'Temporada archivada: no se permiten transferencias.' });
        return;
      }

      const { targetTeamId, dorsal, reason } = req.body as {
        targetTeamId?: string;
        dorsal?: number;
        reason?: string;
      };

      const targetTeam = db.teams.find((t) => t.id === targetTeamId);
      const targetTeamPlayers = targetTeam
        ? db.players.filter((p) => p.teamId === targetTeam.id)
        : [];
      const nextDorsal = dorsal !== undefined ? Number(dorsal) : player.dorsal;

      const validation = validatePlayerTransfer(
        player,
        sourceTeam,
        targetTeam,
        targetTeamPlayers,
        competition.rules,
        { dorsal: nextDorsal }
      );

      if (!validation.ok) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const previousDorsal = player.dorsal;
      player.teamId = targetTeam!.id;
      player.dorsal = nextDorsal;
      if (sourceTeam.starterPlayerIds) {
        sourceTeam.starterPlayerIds = sourceTeam.starterPlayerIds.filter((id) => id !== player.id);
      }

      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId: competition.id,
        action: 'Transferencia de jugador',
        entityType: 'player',
        entityId: player.id,
        previousValue: `#${previousDorsal} ${player.name} (${sourceTeam.name})`,
        newValue: `#${player.dorsal} ${player.name} (${targetTeam!.name})`,
        reason: reason?.trim() || 'Transferencia oficial entre clubes',
        actorName: req.authUser!.name,
        actorRole: req.authUser!.role,
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.json({ player });
    }
  );

  // DT & Admin: Upload / Change Team Crest
  app.patch(
    '/api/teams/:teamId/logo',
    requireAuth,
    requireTeamAccess,
    async (req: AuthedRequest, res: Response) => {
      const { teamId } = req.params;
      const team = db.teams.find((t) => t.id === teamId);
      if (!team) {
        res.status(404).json({ error: 'Equipo no encontrado.' });
        return;
      }

      const { logoUrl } = req.body as { logoUrl?: string | null };
      if (logoUrl && !logoUrl.startsWith('data:image/') && !logoUrl.startsWith('/')) {
        res.status(400).json({ error: 'Formato de imagen no permitido. Usa PNG, JPG o WebP.' });
        return;
      }

      const prevLogo = team.logoUrl ? 'Escudo personalizado' : 'Escudo SVG oficial';
      team.logoUrl = logoUrl ? logoUrl : undefined;

      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId: team.competitionId,
        action: 'Actualización de escudo de club',
        entityType: 'team',
        entityId: team.id,
        previousValue: prevLogo,
        newValue: team.logoUrl ? 'Nuevo escudo cargado' : 'Restaurado a escudo vectorial',
        reason: `Actualización de imagen de ${team.name}`,
        actorName: req.authUser!.name,
        actorRole: req.authUser!.role,
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.json({ team });
    }
  );

  // DT & Admin: Set Team Starting 11 (Titulares)
  app.put(
    '/api/teams/:teamId/starters',
    requireAuth,
    requireTeamAccess,
    async (req: AuthedRequest, res: Response) => {
      const { teamId } = req.params;
      const team = db.teams.find((t) => t.id === teamId);
      if (!team) {
        res.status(404).json({ error: 'Equipo no encontrado.' });
        return;
      }

      const competition = db.competitions.find((c) => c.id === team.competitionId);
      if (!competition) {
        res.status(404).json({ error: 'Competencia no encontrada.' });
        return;
      }
      if (competition.status === 'archived') {
        res.status(400).json({ error: 'Temporada archivada: no se puede modificar el once titular.' });
        return;
      }

      const { starterPlayerIds } = req.body as { starterPlayerIds?: string[] };
      const teamPlayers = db.players.filter((p) => p.teamId === teamId);
      const validation = validateTeamStarters(teamPlayers, starterPlayerIds ?? []);
      if (!validation.ok) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const prevCount = team.starterPlayerIds?.length ?? 0;
      const nextIds = [...(starterPlayerIds ?? [])];
      team.starterPlayerIds = nextIds;

      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId: competition.id,
        action: 'Actualización de 11 titulares',
        entityType: 'team',
        entityId: team.id,
        previousValue: `${prevCount} titular(es)`,
        newValue: `${nextIds.length} titular(es) confirmado(s)`,
        reason: `Alineación titular de ${team.name}`,
        actorName: req.authUser!.name,
        actorRole: req.authUser!.role,
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.json({ team });
    }
  );

  // ADMIN ONLY ROUTES
  app.post(
    '/api/admin/competitions',
    requireAuth,
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const {
        name,
        season,
        category,
        yellowAccumulationLimit = 3,
        redCardSuspensionMatches = 2,
        registrationDeadline = '2026-12-31',
      } = req.body as Partial<Competition> & {
        yellowAccumulationLimit?: number;
        redCardSuspensionMatches?: number;
        registrationDeadline?: string;
      };

      if (!name || !season) {
        res.status(400).json({ error: 'Nombre y temporada son obligatorios.' });
        return;
      }

      const comp: Competition = {
        id: `comp-${crypto.randomUUID().slice(0, 8)}`,
        name: name.trim(),
        season: season.trim(),
        category: (category ?? 'Torneo Local').trim(),
        status: 'active',
        rules: {
          maxActivePlayers: 25,
          yellowAccumulationLimit: Math.max(1, Number(yellowAccumulationLimit)),
          redCardSuspensionMatches: Math.max(1, Number(redCardSuspensionMatches)),
          registrationOpen: true,
          registrationDeadline,
          pointsWin: 3,
          pointsDraw: 1,
          pointsLoss: 0,
        },
      };

      db.competitions.push(comp);
      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId: comp.id,
        action: 'Creación de competencia',
        entityType: 'competition',
        entityId: comp.id,
        previousValue: 'N/A',
        newValue: `${comp.name} (${comp.season})`,
        reason: 'Configuración oficial de nueva competencia',
        actorName: req.authUser!.name,
        actorRole: 'admin',
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.status(201).json({ competition: comp });
    }
  );

  app.patch(
    '/api/admin/competitions/:competitionId',
    requireAuth,
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const comp = db.competitions.find((c) => c.id === req.params.competitionId);
      if (!comp) {
        res.status(404).json({ error: 'Competencia no encontrada.' });
        return;
      }

      const { status, rules, championTeamName } = req.body as {
        status?: 'active' | 'archived';
        rules?: Partial<Competition['rules']>;
        championTeamName?: string;
      };

      const prev = `${comp.status} · inscripción:${comp.rules.registrationOpen ? 'abierta' : 'cerrada'}`;

      if (status) comp.status = status;
      if (championTeamName !== undefined) comp.championTeamName = championTeamName;
      if (rules) {
        comp.rules = {
          ...comp.rules,
          ...rules,
          maxActivePlayers: Math.min(25, Math.max(11, Number(rules.maxActivePlayers ?? comp.rules.maxActivePlayers))),
          yellowAccumulationLimit: Math.max(
            1,
            Number(rules.yellowAccumulationLimit ?? comp.rules.yellowAccumulationLimit)
          ),
          redCardSuspensionMatches: Math.max(
            1,
            Number(rules.redCardSuspensionMatches ?? comp.rules.redCardSuspensionMatches)
          ),
        };
      }

      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId: comp.id,
        action: 'Actualización de reglamento / temporada',
        entityType: 'competition',
        entityId: comp.id,
        previousValue: prev,
        newValue: `${comp.status} · inscripción:${comp.rules.registrationOpen ? 'abierta' : 'cerrada'}`,
        reason: 'Ajuste administrativo de reglas de torneo',
        actorName: req.authUser!.name,
        actorRole: 'admin',
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.json({ competition: comp });
    }
  );

  app.post(
    '/api/admin/teams',
    requireAuth,
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const {
        competitionId,
        name,
        shortName,
        primaryColor = '#D4AF37',
        secondaryColor = '#141418',
        motif = 'star',
        dtName,
        neighborhood = 'San Juan del Sur',
      } = req.body as Partial<Team>;

      if (!competitionId || !name || !shortName || !dtName) {
        res.status(400).json({ error: 'Nombre, sigla, torneo y DT son obligatorios.' });
        return;
      }

      const newTeam: Team = {
        id: `team-${crypto.randomUUID().slice(0, 8)}`,
        competitionId,
        name: name.trim(),
        shortName: shortName.trim().toUpperCase().slice(0, 4),
        primaryColor,
        secondaryColor,
        motif,
        dtName: dtName.trim(),
        neighborhood: neighborhood.trim(),
      };

      db.teams.push(newTeam);
      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId,
        action: 'Registro de club',
        entityType: 'team',
        entityId: newTeam.id,
        previousValue: 'N/A',
        newValue: `${newTeam.name} (DT: ${newTeam.dtName})`,
        reason: 'Inscripción oficial de equipo',
        actorName: req.authUser!.name,
        actorRole: 'admin',
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.status(201).json({ team: newTeam });
    }
  );

  app.post(
    '/api/admin/matches',
    requireAuth,
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const { competitionId, jornada, homeTeamId, awayTeamId, kickoffAt, venue, referee } =
        req.body as Partial<Match>;

      if (!competitionId || !jornada || !homeTeamId || !awayTeamId || !kickoffAt || !venue) {
        res.status(400).json({ error: 'Completa todos los campos del partido.' });
        return;
      }
      if (homeTeamId === awayTeamId) {
        res.status(400).json({ error: 'El equipo local y visitante deben ser distintos.' });
        return;
      }

      const match: Match = {
        id: `m-${crypto.randomUUID().slice(0, 8)}`,
        competitionId,
        jornada: Number(jornada),
        homeTeamId,
        awayTeamId,
        kickoffAt,
        venue: venue.trim(),
        status: 'programado',
        homeScore: 0,
        awayScore: 0,
        referee: referee?.trim() || 'Por designar',
      };

      db.matches.push(match);
      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId,
        action: 'Programación de partido',
        entityType: 'match',
        entityId: match.id,
        previousValue: 'Sin programar',
        newValue: `Jornada ${match.jornada} · ${match.venue}`,
        reason: 'Publicación de calendario oficial',
        actorName: req.authUser!.name,
        actorRole: 'admin',
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.status(201).json({ match });
    }
  );

  app.patch(
    '/api/admin/matches/:matchId',
    requireAuth,
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const match = db.matches.find((m) => m.id === req.params.matchId);
      if (!match) {
        res.status(404).json({ error: 'Partido no encontrado.' });
        return;
      }

      const { status, homeScore, awayScore, liveMinute, clockAction, reason } = req.body as {
        status?: MatchStatus;
        homeScore?: number;
        awayScore?: number;
        liveMinute?: number;
        clockAction?: 'pause' | 'resume';
        reason?: string;
      };

      const prev = `${match.status} (${match.homeScore}-${match.awayScore})`;
      const prevStatus = match.status;
      if (status) match.status = status;
      if (homeScore !== undefined) match.homeScore = Math.max(0, Number(homeScore));
      if (awayScore !== undefined) match.awayScore = Math.max(0, Number(awayScore));
      if (liveMinute !== undefined) match.liveMinute = Math.max(1, Math.min(130, Number(liveMinute)));

      const now = Date.now();
      if (clockAction === 'pause' && match.status === 'en_juego') {
        if (!match.liveClockPaused) {
          const runningSecs = match.liveStartedAt
            ? Math.max(0, Math.floor((now - new Date(match.liveStartedAt).getTime()) / 1000))
            : 0;
          const totalElapsed = Math.max(0, Math.floor(match.liveElapsedSeconds ?? 0)) + runningSecs;
          match.liveElapsedSeconds = totalElapsed;
          match.liveStartedAt = undefined;
          match.liveClockPaused = true;
          match.liveMinute = Math.max(1, Math.floor(totalElapsed / 60) + 1);
        }
      } else if (clockAction === 'resume' && match.status === 'en_juego') {
        if (match.liveClockPaused || !match.liveStartedAt) {
          match.liveStartedAt = new Date(now).toISOString();
          match.liveClockPaused = false;
        }
      } else if (status === 'en_juego') {
        if (prevStatus !== 'en_juego') {
          match.liveElapsedSeconds = 0;
          match.liveClockPaused = false;
          match.liveStartedAt = new Date(now).toISOString();
        } else if (!match.liveStartedAt && !match.liveClockPaused) {
          match.liveStartedAt = new Date(now).toISOString();
        }
      } else if (status) {
        match.liveMinute = undefined;
        match.liveStartedAt = undefined;
        match.liveElapsedSeconds = undefined;
        match.liveClockPaused = undefined;
      }

      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId: match.competitionId,
        action:
          clockAction === 'pause'
            ? 'Pausa de cronómetro en vivo'
            : clockAction === 'resume'
              ? 'Reanudación de cronómetro en vivo'
              : 'Actualización de estado / marcador de partido',
        entityType: 'match',
        entityId: match.id,
        previousValue: prev,
        newValue: `${match.status} (${match.homeScore}-${match.awayScore})`,
        reason: reason?.trim() || 'Actualización de acta oficial',
        actorName: req.authUser!.name,
        actorRole: 'admin',
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.json({ match });
    }
  );

  app.post(
    '/api/admin/matches/:matchId/events',
    requireAuth,
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const match = db.matches.find((m) => m.id === req.params.matchId);
      if (!match) {
        res.status(404).json({ error: 'Partido no encontrado.' });
        return;
      }

      const { teamId, playerId, type, minute, note, visibility } = req.body as {
        teamId?: string;
        playerId?: string;
        type?: EventType;
        minute?: number;
        note?: string;
        visibility?: 'public' | 'internal';
      };

      if (!teamId || !type) {
        res.status(400).json({ error: 'Equipo y tipo de evento son obligatorios.' });
        return;
      }
      if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
        res.status(400).json({ error: 'El equipo seleccionado no pertenece a este partido.' });
        return;
      }
      if ((type === 'goal' || type === 'yellow_card' || type === 'red_card') && !playerId) {
        res.status(400).json({ error: 'Selecciona el jugador involucrado en el evento.' });
        return;
      }
      if (type === 'special_note' && (!note || !note.trim())) {
        res.status(400).json({ error: 'Escribe el texto de la anotación especial.' });
        return;
      }

      const prevScore = `${match.homeScore}-${match.awayScore}`;

      const event: MatchEvent = {
        id: `ev-${crypto.randomUUID().slice(0, 8)}`,
        competitionId: match.competitionId,
        matchId: match.id,
        teamId,
        playerId: playerId || undefined,
        type,
        minute: minute !== undefined && Number(minute) > 0 ? Number(minute) : undefined,
        note: note?.trim() || undefined,
        visibility: type === 'special_note' ? visibility ?? 'public' : 'public',
        createdAt: new Date().toISOString(),
        createdBy: req.authUser!.name,
      };

      db.events.push(event);

      if (type === 'goal') {
        const computed = computeMatchScoreFromEvents(match, db.events);
        match.homeScore = computed.homeScore;
        match.awayScore = computed.awayScore;
        if (match.status === 'programado') {
          match.status = 'en_juego';
          match.liveMinute = event.minute ?? 1;
        }
      }

      const player = playerId ? db.players.find((p) => p.id === playerId) : undefined;
      const typeLabel =
        type === 'goal'
          ? 'Gol'
          : type === 'yellow_card'
            ? 'Tarjeta amarilla'
            : type === 'red_card'
              ? 'Tarjeta roja'
              : `Anotación (${event.visibility === 'internal' ? 'Interna' : 'Pública'})`;

      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId: match.competitionId,
        action: `Registro en acta: ${typeLabel}`,
        entityType: 'event',
        entityId: event.id,
        previousValue: prevScore,
        newValue: `${match.homeScore}-${match.awayScore}${player ? ` · ${player.name}` : ''}`,
        reason: event.note || `${typeLabel}${event.minute ? ` al min ${event.minute}'` : ''}`,
        actorName: req.authUser!.name,
        actorRole: 'admin',
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.status(201).json({ event, match });
    }
  );

  app.delete(
    '/api/admin/events/:eventId',
    requireAuth,
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const idx = db.events.findIndex((e) => e.id === req.params.eventId);
      if (idx === -1) {
        res.status(404).json({ error: 'Evento no encontrado.' });
        return;
      }

      const removed = db.events[idx];
      db.events.splice(idx, 1);

      const match = db.matches.find((m) => m.id === removed.matchId);
      const prevScore = match ? `${match.homeScore}-${match.awayScore}` : 'N/A';

      if (match && removed.type === 'goal') {
        const computed = computeMatchScoreFromEvents(match, db.events);
        match.homeScore = computed.homeScore;
        match.awayScore = computed.awayScore;
      }

      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId: removed.competitionId,
        action: 'Corrección / eliminación de evento de acta',
        entityType: 'event',
        entityId: removed.id,
        previousValue: `${removed.type} (${prevScore})`,
        newValue: match ? `Marcador recalculado: ${match.homeScore}-${match.awayScore}` : 'Eliminado',
        reason:
          typeof req.body?.reason === 'string' && req.body.reason.trim()
            ? req.body.reason.trim()
            : 'Corrección oficial de acta de partido',
        actorName: req.authUser!.name,
        actorRole: 'admin',
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.json({ ok: true, match });
    }
  );

  app.post(
    '/api/admin/point-adjustments',
    requireAuth,
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const { competitionId, teamId, deltaPoints, reason } = req.body as {
        competitionId?: string;
        teamId?: string;
        deltaPoints?: number;
        reason?: string;
      };

      if (!competitionId || !teamId || deltaPoints === undefined || Number(deltaPoints) === 0) {
        res.status(400).json({ error: 'Selecciona equipo y un ajuste distinto de cero.' });
        return;
      }
      if (!reason || reason.trim().length < 5) {
        res.status(400).json({
          error: 'Todo ajuste excepcional requiere un motivo oficial claro (mínimo 5 caracteres).',
        });
        return;
      }

      const comp = db.competitions.find((c) => c.id === competitionId);
      const team = db.teams.find((t) => t.id === teamId && t.competitionId === competitionId);
      if (!comp || !team) {
        res.status(404).json({ error: 'Competencia o equipo no encontrado.' });
        return;
      }

      const beforeStandings = calculateStandings(
        db.teams.filter((t) => t.competitionId === competitionId),
        db.matches.filter((m) => m.competitionId === competitionId),
        db.pointAdjustments.filter((a) => a.competitionId === competitionId),
        comp.rules
      );
      const prevRow = beforeStandings.find((r) => r.teamId === teamId);
      const prevPts = prevRow?.pts ?? 0;
      const delta = Number(deltaPoints);

      const adjustment = {
        id: `adj-${crypto.randomUUID().slice(0, 8)}`,
        competitionId,
        teamId,
        deltaPoints: delta,
        reason: reason.trim(),
        createdAt: new Date().toISOString(),
        createdBy: req.authUser!.name,
      };

      db.pointAdjustments.push(adjustment);
      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId,
        action: `Ajuste excepcional de puntos (${team.shortName})`,
        entityType: 'standings',
        entityId: team.id,
        previousValue: `${prevPts} pts`,
        newValue: `${prevPts + delta} pts (${delta >= 0 ? `+${delta}` : delta})`,
        reason: reason.trim(),
        actorName: req.authUser!.name,
        actorRole: 'admin',
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.status(201).json({ adjustment });
    }
  );

  app.post(
    '/api/admin/discipline/override',
    requireAuth,
    requireAdmin,
    async (req: AuthedRequest, res: Response) => {
      const { competitionId, playerId, matchesRemaining, validated, note } = req.body as {
        competitionId?: string;
        playerId?: string;
        matchesRemaining?: number;
        validated?: boolean;
        note?: string;
      };

      if (!competitionId || !playerId || matchesRemaining === undefined) {
        res.status(400).json({ error: 'Faltan datos de sanción.' });
        return;
      }

      const player = db.players.find((p) => p.id === playerId && p.competitionId === competitionId);
      if (!player) {
        res.status(404).json({ error: 'Jugador no encontrado.' });
        return;
      }

      const nextCount = Math.max(0, Number(matchesRemaining));
      const existing = db.suspensionOverrides.find(
        (s) => s.competitionId === competitionId && s.playerId === playerId
      );
      const prevVal = existing ? `${existing.matchesRemaining} partido(s)` : 'Cálculo automático';

      if (existing) {
        existing.matchesRemaining = nextCount;
        existing.validated = validated ?? true;
        existing.note = note?.trim() || existing.note;
        existing.updatedAt = new Date().toISOString();
        existing.updatedBy = req.authUser!.name;
      } else {
        db.suspensionOverrides.push({
          id: `sus-${crypto.randomUUID().slice(0, 8)}`,
          competitionId,
          playerId,
          matchesRemaining: nextCount,
          validated: validated ?? true,
          note: note?.trim() || 'Validado por Comité Disciplinario',
          updatedAt: new Date().toISOString(),
          updatedBy: req.authUser!.name,
        });
      }

      db.auditLogs.push({
        id: `aud-${crypto.randomUUID().slice(0, 8)}`,
        competitionId,
        action: `Validación disciplinaria (${player.name})`,
        entityType: 'discipline',
        entityId: player.id,
        previousValue: prevVal,
        newValue: `${nextCount} partido(s) pendiente(s)`,
        reason: note?.trim() || 'Resolución de Comité Disciplinario',
        actorName: req.authUser!.name,
        actorRole: 'admin',
        createdAt: new Date().toISOString(),
      });

      await persistDb();
      res.json({ ok: true });
    }
  );

  app.post(
    '/api/admin/reset-demo',
    requireAuth,
    requireAdmin,
    async (_req: AuthedRequest, res: Response) => {
      db = createSeedDatabase();
      await persistDb();
      res.json({ ok: true });
    }
  );

  // Vite dev middleware or production static
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Liga San Juan del Sur server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
