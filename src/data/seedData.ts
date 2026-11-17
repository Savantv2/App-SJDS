import crypto from 'node:crypto';
import type {
  AuditLogEntry,
  Competition,
  CrestMotif,
  Match,
  MatchEvent,
  Player,
  PointAdjustment,
  PositionCode,
  SuspensionOverride,
  Team,
  UserAccount,
} from '../types/league';

export const CURRENT_SEED_VERSION = 4;

export interface LeagueDatabase {
  seedVersion?: number;
  isDemoData: boolean;
  competitions: Competition[];
  teams: Team[];
  players: Player[];
  matches: Match[];
  events: MatchEvent[];
  pointAdjustments: PointAdjustment[];
  suspensionOverrides: SuspensionOverride[];
  auditLogs: AuditLogEntry[];
  users: UserAccount[];
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`sjds-salt:${password}`).digest('hex');
}

const TEAM_PALETTES: Array<{ primary: string; secondary: string; motif: CrestMotif; zone: string }> = [
  { primary: '#D4AF37', secondary: '#141418', motif: 'shark', zone: 'San Juan del Sur' },
  { primary: '#0EA5E9', secondary: '#0B253A', motif: 'wave', zone: 'San Juan del Sur' },
  { primary: '#10B981', secondary: '#082E22', motif: 'sun', zone: 'San Juan del Sur' },
  { primary: '#F97316', secondary: '#3B1808', motif: 'flame', zone: 'San Juan del Sur' },
  { primary: '#E11D48', secondary: '#3B0A19', motif: 'crown', zone: 'San Juan del Sur' },
  { primary: '#8B5CF6', secondary: '#24124A', motif: 'star', zone: 'San Juan del Sur' },
  { primary: '#EAB308', secondary: '#2E2305', motif: 'sun', zone: 'San Juan del Sur' },
  { primary: '#06B6D4', secondary: '#082F3A', motif: 'wave', zone: 'San Juan del Sur' },
  { primary: '#22C55E', secondary: '#0B2E18', motif: 'star', zone: 'San Juan del Sur' },
  { primary: '#F43F5E', secondary: '#380914', motif: 'flame', zone: 'San Juan del Sur' },
  { primary: '#3B82F6', secondary: '#0D1F42', motif: 'shark', zone: 'San Juan del Sur' },
  { primary: '#A855F7', secondary: '#270F40', motif: 'crown', zone: 'San Juan del Sur' },
  { primary: '#14B8A6', secondary: '#082E2B', motif: 'wave', zone: 'San Juan del Sur' },
  { primary: '#FB923C', secondary: '#3D1D07', motif: 'flame', zone: 'San Juan del Sur' },
  { primary: '#EC4899', secondary: '#3A0A22', motif: 'star', zone: 'San Juan del Sur' },
  { primary: '#D4AF37', secondary: '#1C1917', motif: 'crown', zone: 'San Juan del Sur' },
];

const STARTER_ROSTER_TEMPLATE: Array<{
  name: string;
  dorsal: number;
  primaryPosition: PositionCode;
}> = [
  { name: 'Portero Titular', dorsal: 1, primaryPosition: 'POR' },
  { name: 'Defensa Central', dorsal: 4, primaryPosition: 'DEF' },
  { name: 'Mediocampista', dorsal: 8, primaryPosition: 'MED' },
  { name: 'Delantero', dorsal: 9, primaryPosition: 'DEL' },
];

const DEMO_CLUBS: Array<{
  id: string;
  name: string;
  shortName: string;
  dtName: string;
  neighborhood: string;
  eliminated?: boolean;
}> = [
  { id: 'demo-team-1', name: 'Tiburones de San Juan', shortName: 'TIB', dtName: 'Carlos Mendoza', neighborhood: 'Centro SJDS' },
  { id: 'demo-team-2', name: 'Atlético Nacascolo', shortName: 'NAC', dtName: 'Roberto Sequeira', neighborhood: 'Nacascolo' },
  { id: 'demo-team-3', name: 'Deportivo Marsella', shortName: 'MAR', dtName: 'Javier Morales', neighborhood: 'Playa Marsella' },
  { id: 'demo-team-4', name: 'Real Talanguera', shortName: 'TAL', dtName: 'Ernesto Palacios', neighborhood: 'Talanguera' },
  { id: 'demo-team-5', name: 'Estrella del Sur', shortName: 'EST', dtName: 'Mauricio Herrera', neighborhood: 'Barrio El Carmen' },
  { id: 'demo-team-6', name: 'Huracán El Remanso', shortName: 'REM', dtName: 'Wilmer Gaitán', neighborhood: 'El Remanso' },
  { id: 'demo-team-7', name: 'Costa Brava FC', shortName: 'COS', dtName: 'Danilo Estrada', neighborhood: 'Playa El Toro' },
  { id: 'demo-team-8', name: 'Sportivo Maderas', shortName: 'MAD', dtName: 'Álvaro Rodríguez', neighborhood: 'Playa Maderas' },
  { id: 'demo-team-9', name: 'Unión El Carmen', shortName: 'CAR', dtName: 'Oscar Gutiérrez', neighborhood: 'El Carmen' },
  { id: 'demo-team-10', name: 'Academia Ostional', shortName: 'OST', dtName: 'Héctor Martínez', neighborhood: 'Ostional' },
  { id: 'demo-team-11', name: 'Juvenil Las Delicias', shortName: 'DEL', dtName: 'Byron Castellón', neighborhood: 'Las Delicias' },
  { id: 'demo-team-12', name: 'Pumas de Escameca', shortName: 'ESC', dtName: 'Rolando Chávez', neighborhood: 'Escameca' },
  { id: 'demo-team-13', name: 'Marinos del Pacífico', shortName: 'PAC', dtName: 'Fernando López', neighborhood: 'San Antonio', eliminated: true },
  { id: 'demo-team-14', name: 'Dragones La Chocolata', shortName: 'CHO', dtName: 'Sergio Somarriba', neighborhood: 'La Chocolata', eliminated: true },
  { id: 'demo-team-15', name: 'Cóndores Miravalles', shortName: 'MIR', dtName: 'Julio César Rivas', neighborhood: 'Miravalles', eliminated: true },
  { id: 'demo-team-16', name: 'Corsarios El Bastón', shortName: 'BAS', dtName: 'Miguel Ángel Torres', neighborhood: 'El Bastón', eliminated: true },
];

const FIRST_NAMES = [
  'Mateo', 'Luis', 'Gabriel', 'Kevin', 'Erick', 'Cristian', 'Andrés', 'Brayan',
  'José', 'Marlon', 'Sebastián', 'Diego', 'Francisco', 'Ronald', 'Jairo', 'Axel',
  'Daniel', 'Esteban', 'Pablo', 'Eduardo', 'César', 'Nelson', 'Víctor', 'Adrián',
  'Marcos', 'Harold', 'Rodrigo', 'Iván', 'David', 'Kenneth', 'Leonel', 'Óscar',
];

const LAST_NAMES = [
  'Rivera', 'Vargas', 'Sequeira', 'Morales', 'Palacios', 'Herrera', 'Gaitán', 'Estrada',
  'Rodríguez', 'Gutiérrez', 'Martínez', 'Castellón', 'Chávez', 'López', 'Somarriba', 'Rivas',
  'Torres', 'Mendoza', 'Sánchez', 'Ruiz', 'Espinoza', 'Pérez', 'Alemán', 'Guerrero',
  'Zelaya', 'Urbina', 'Blandón', 'Medina', 'Salazar', 'Centeno', 'Orozco', 'Cuadra',
];

// 18 players per club (within 16-20 players requirement)
const DEMO_SQUAD_SLOTS: Array<{
  dorsal: number;
  primaryPosition: PositionCode;
  secondaryPosition?: PositionCode;
}> = [
  { dorsal: 1, primaryPosition: 'POR' },
  { dorsal: 12, primaryPosition: 'POR' },
  { dorsal: 2, primaryPosition: 'DEF' },
  { dorsal: 3, primaryPosition: 'DEF' },
  { dorsal: 4, primaryPosition: 'DEF', secondaryPosition: 'MED' },
  { dorsal: 5, primaryPosition: 'DEF' },
  { dorsal: 6, primaryPosition: 'DEF' },
  { dorsal: 15, primaryPosition: 'DEF' },
  { dorsal: 7, primaryPosition: 'MED', secondaryPosition: 'DEL' },
  { dorsal: 8, primaryPosition: 'MED' },
  { dorsal: 10, primaryPosition: 'MED', secondaryPosition: 'DEL' },
  { dorsal: 14, primaryPosition: 'MED' },
  { dorsal: 16, primaryPosition: 'MED' },
  { dorsal: 9, primaryPosition: 'DEL' },
  { dorsal: 11, primaryPosition: 'DEL', secondaryPosition: 'MED' },
  { dorsal: 17, primaryPosition: 'DEL' },
  { dorsal: 18, primaryPosition: 'DEL' },
  { dorsal: 19, primaryPosition: 'DEL' },
];

function buildDemoLeagueData() {
  const competitionId = 'liga-demo';

  const competition: Competition = {
    id: competitionId,
    name: 'Liga Demo',
    season: 'Clausura 2026',
    category: 'Primera División',
    status: 'active',
    rules: {
      maxActivePlayers: 25,
      yellowAccumulationLimit: 3,
      redCardSuspensionMatches: 2,
      registrationOpen: true,
      registrationDeadline: '2026-12-31',
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
    },
  };

  const teams: Team[] = DEMO_CLUBS.map((club, idx) => {
    const palette = TEAM_PALETTES[idx % TEAM_PALETTES.length];
    return {
      id: club.id,
      competitionId,
      name: club.name,
      shortName: club.shortName,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      motif: palette.motif,
      dtName: club.dtName,
      dtUserId: club.id === 'demo-team-1' ? 'user-dt-demo-1' : undefined,
      neighborhood: club.neighborhood,
      eliminated: club.eliminated,
    };
  });

  const players: Player[] = [];
  for (let tIdx = 0; tIdx < teams.length; tIdx++) {
    const team = teams[tIdx];
    for (let sIdx = 0; sIdx < DEMO_SQUAD_SLOTS.length; sIdx++) {
      const slot = DEMO_SQUAD_SLOTS[sIdx];
      const first = FIRST_NAMES[(tIdx * 7 + sIdx * 3) % FIRST_NAMES.length];
      const last = LAST_NAMES[(tIdx * 5 + sIdx * 11) % LAST_NAMES.length];
      let fullName = `${first} ${last}`;
      if (team.id === 'demo-team-1' && slot.dorsal === 9) fullName = 'Mateo Rivera';
      if (team.id === 'demo-team-2' && slot.dorsal === 10) fullName = 'Luis Vargas';
      if (team.id === 'demo-team-7' && slot.dorsal === 11) fullName = 'Kevin López';
      if (team.id === 'demo-team-4' && slot.dorsal === 4) fullName = 'Andrés Palacios';

      players.push({
        id: `demo-p-t${tIdx + 1}-d${slot.dorsal}`,
        teamId: team.id,
        competitionId,
        name: fullName,
        dorsal: slot.dorsal,
        primaryPosition: slot.primaryPosition,
        secondaryPosition: slot.secondaryPosition,
        status: 'active',
        joinedAt: '2026-11-01',
      });
    }
  }

  // Helper to get player ID for a club and dorsal
  const pid = (teamNum: number, dorsal: number) => `demo-p-t${teamNum}-d${dorsal}`;

  // Jornada 1 (8 matches finalized - high-scoring goleadas) + Jornada 2 (4 finalized, 1 paused 3-1 2nd half, 3 scheduled)
  const matches: Match[] = [
    // Jornada 1
    {
      id: 'm-demo-j1-1',
      competitionId,
      jornada: 1,
      homeTeamId: 'demo-team-1',
      awayTeamId: 'demo-team-16',
      kickoffAt: '2026-11-08T15:00:00-06:00',
      venue: 'Estadio Municipal SJDS',
      status: 'finalizado',
      homeScore: 7,
      awayScore: 2,
      referee: 'J. Morales',
    },
    {
      id: 'm-demo-j1-2',
      competitionId,
      jornada: 1,
      homeTeamId: 'demo-team-2',
      awayTeamId: 'demo-team-15',
      kickoffAt: '2026-11-08T17:30:00-06:00',
      venue: 'Estadio Municipal SJDS',
      status: 'finalizado',
      homeScore: 6,
      awayScore: 1,
      referee: 'R. Castillo',
    },
    {
      id: 'm-demo-j1-3',
      competitionId,
      jornada: 1,
      homeTeamId: 'demo-team-3',
      awayTeamId: 'demo-team-14',
      kickoffAt: '2026-11-09T15:00:00-06:00',
      venue: 'Cancha Playa Marsella',
      status: 'finalizado',
      homeScore: 8,
      awayScore: 1,
      referee: 'M. Obando',
    },
    {
      id: 'm-demo-j1-4',
      competitionId,
      jornada: 1,
      homeTeamId: 'demo-team-4',
      awayTeamId: 'demo-team-13',
      kickoffAt: '2026-11-09T17:30:00-06:00',
      venue: 'Estadio Municipal SJDS',
      status: 'finalizado',
      homeScore: 5,
      awayScore: 3,
      referee: 'J. Morales',
    },
    {
      id: 'm-demo-j1-5',
      competitionId,
      jornada: 1,
      homeTeamId: 'demo-team-5',
      awayTeamId: 'demo-team-6',
      kickoffAt: '2026-11-10T15:00:00-06:00',
      venue: 'Cancha El Remanso',
      status: 'finalizado',
      homeScore: 4,
      awayScore: 4,
      referee: 'C. Alemán',
    },
    {
      id: 'm-demo-j1-6',
      competitionId,
      jornada: 1,
      homeTeamId: 'demo-team-7',
      awayTeamId: 'demo-team-8',
      kickoffAt: '2026-11-10T17:30:00-06:00',
      venue: 'Estadio Municipal SJDS',
      status: 'finalizado',
      homeScore: 6,
      awayScore: 2,
      referee: 'R. Castillo',
    },
    {
      id: 'm-demo-j1-7',
      competitionId,
      jornada: 1,
      homeTeamId: 'demo-team-9',
      awayTeamId: 'demo-team-10',
      kickoffAt: '2026-11-11T15:30:00-06:00',
      venue: 'Cancha El Carmen',
      status: 'finalizado',
      homeScore: 2,
      awayScore: 5,
      referee: 'M. Obando',
    },
    {
      id: 'm-demo-j1-8',
      competitionId,
      jornada: 1,
      homeTeamId: 'demo-team-11',
      awayTeamId: 'demo-team-12',
      kickoffAt: '2026-11-11T17:30:00-06:00',
      venue: 'Estadio Municipal SJDS',
      status: 'finalizado',
      homeScore: 3,
      awayScore: 3,
      referee: 'C. Alemán',
    },

    // Jornada 2 (4 finalizados con marcadores abultados, 1 en juego 3-1 pausado 2do tiempo, 3 programados)
    {
      id: 'm-demo-j2-1',
      competitionId,
      jornada: 2,
      homeTeamId: 'demo-team-16',
      awayTeamId: 'demo-team-2',
      kickoffAt: '2026-11-15T15:00:00-06:00',
      venue: 'Estadio Municipal SJDS',
      status: 'finalizado',
      homeScore: 1,
      awayScore: 7,
      referee: 'J. Morales',
    },
    {
      id: 'm-demo-j2-2',
      competitionId,
      jornada: 2,
      homeTeamId: 'demo-team-15',
      awayTeamId: 'demo-team-3',
      kickoffAt: '2026-11-15T17:30:00-06:00',
      venue: 'Estadio Municipal SJDS',
      status: 'finalizado',
      homeScore: 2,
      awayScore: 9,
      referee: 'R. Castillo',
    },
    {
      id: 'm-demo-j2-3',
      competitionId,
      jornada: 2,
      homeTeamId: 'demo-team-14',
      awayTeamId: 'demo-team-5',
      kickoffAt: '2026-11-16T09:30:00-06:00',
      venue: 'Cancha El Remanso',
      status: 'finalizado',
      homeScore: 1,
      awayScore: 8,
      referee: 'M. Obando',
    },
    {
      id: 'm-demo-j2-4',
      competitionId,
      jornada: 2,
      homeTeamId: 'demo-team-13',
      awayTeamId: 'demo-team-7',
      kickoffAt: '2026-11-16T11:30:00-06:00',
      venue: 'Cancha Playa Marsella',
      status: 'finalizado',
      homeScore: 2,
      awayScore: 7,
      referee: 'C. Alemán',
    },
    {
      id: 'm-demo-j2-5',
      competitionId,
      jornada: 2,
      homeTeamId: 'demo-team-1',
      awayTeamId: 'demo-team-4',
      kickoffAt: '2026-11-16T15:30:00-06:00',
      venue: 'Estadio Municipal SJDS',
      status: 'en_juego',
      homeScore: 3,
      awayScore: 1,
      liveMinute: 64,
      liveElapsedSeconds: 63 * 60 + 24,
      liveClockPaused: true,
      referee: 'J. Morales',
    },
    {
      id: 'm-demo-j2-6',
      competitionId,
      jornada: 2,
      homeTeamId: 'demo-team-6',
      awayTeamId: 'demo-team-9',
      kickoffAt: '2026-11-16T18:00:00-06:00',
      venue: 'Estadio Municipal SJDS',
      status: 'programado',
      homeScore: 0,
      awayScore: 0,
      referee: 'R. Castillo',
    },
    {
      id: 'm-demo-j2-7',
      competitionId,
      jornada: 2,
      homeTeamId: 'demo-team-8',
      awayTeamId: 'demo-team-11',
      kickoffAt: '2026-11-17T15:30:00-06:00',
      venue: 'Cancha Playa Marsella',
      status: 'programado',
      homeScore: 0,
      awayScore: 0,
      referee: 'M. Obando',
    },
    {
      id: 'm-demo-j2-8',
      competitionId,
      jornada: 2,
      homeTeamId: 'demo-team-10',
      awayTeamId: 'demo-team-12',
      kickoffAt: '2026-11-17T17:30:00-06:00',
      venue: 'Cancha El Remanso',
      status: 'programado',
      homeScore: 0,
      awayScore: 0,
      referee: 'C. Alemán',
    },
  ];

  let evIdx = 1;
  const events: MatchEvent[] = [];
  const addEv = (
    matchId: string,
    teamNum: number,
    dorsal: number,
    type: MatchEvent['type'],
    minute: number,
    createdAt: string,
    note?: string
  ) => {
    events.push({
      id: `demo-ev-${evIdx++}`,
      competitionId,
      matchId,
      teamId: `demo-team-${teamNum}`,
      playerId: pid(teamNum, dorsal),
      type,
      minute,
      note,
      visibility: 'public',
      createdAt,
      createdBy: 'Comité Directivo SJDS',
    });
  };

  // J1 goals + cards (at least 2-4 yellow cards per team!)
  // m-demo-j1-1: TIB 7 - 2 BAS
  addEv('m-demo-j1-1', 1, 11, 'goal', 8, '2026-11-08T15:08:00-06:00');
  addEv('m-demo-j1-1', 1, 10, 'goal', 19, '2026-11-08T15:19:00-06:00');
  addEv('m-demo-j1-1', 16, 9, 'goal', 26, '2026-11-08T15:26:00-06:00');
  addEv('m-demo-j1-1', 1, 11, 'goal', 38, '2026-11-08T15:38:00-06:00');
  addEv('m-demo-j1-1', 1, 7, 'goal', 52, '2026-11-08T16:07:00-06:00');
  addEv('m-demo-j1-1', 1, 10, 'goal', 64, '2026-11-08T16:19:00-06:00');
  addEv('m-demo-j1-1', 16, 10, 'goal', 71, '2026-11-08T16:26:00-06:00');
  addEv('m-demo-j1-1', 1, 11, 'goal', 79, '2026-11-08T16:34:00-06:00');
  addEv('m-demo-j1-1', 1, 17, 'goal', 87, '2026-11-08T16:42:00-06:00');
  addEv('m-demo-j1-1', 1, 4, 'yellow_card', 22, '2026-11-08T15:22:00-06:00');
  addEv('m-demo-j1-1', 1, 6, 'yellow_card', 51, '2026-11-08T16:06:00-06:00');
  addEv('m-demo-j1-1', 1, 8, 'yellow_card', 74, '2026-11-08T16:29:00-06:00');
  addEv('m-demo-j1-1', 16, 4, 'yellow_card', 35, '2026-11-08T15:35:00-06:00');
  addEv('m-demo-j1-1', 16, 5, 'yellow_card', 62, '2026-11-08T16:17:00-06:00');
  addEv('m-demo-j1-1', 16, 2, 'yellow_card', 80, '2026-11-08T16:35:00-06:00');
  addEv('m-demo-j1-1', 16, 6, 'red_card', 84, '2026-11-08T16:39:00-06:00', 'Falta táctica último hombre');

  // m-demo-j1-2: NAC 6 - 1 MIR
  addEv('m-demo-j1-2', 2, 9, 'goal', 12, '2026-11-08T17:42:00-06:00');
  addEv('m-demo-j1-2', 2, 10, 'goal', 25, '2026-11-08T17:55:00-06:00');
  addEv('m-demo-j1-2', 15, 9, 'goal', 39, '2026-11-08T18:09:00-06:00');
  addEv('m-demo-j1-2', 2, 9, 'goal', 54, '2026-11-08T18:39:00-06:00');
  addEv('m-demo-j1-2', 2, 11, 'goal', 68, '2026-11-08T18:53:00-06:00');
  addEv('m-demo-j1-2', 2, 10, 'goal', 77, '2026-11-08T19:02:00-06:00');
  addEv('m-demo-j1-2', 2, 8, 'goal', 88, '2026-11-08T19:13:00-06:00');
  addEv('m-demo-j1-2', 2, 5, 'yellow_card', 29, '2026-11-08T17:59:00-06:00');
  addEv('m-demo-j1-2', 2, 4, 'yellow_card', 58, '2026-11-08T18:43:00-06:00');
  addEv('m-demo-j1-2', 15, 3, 'yellow_card', 41, '2026-11-08T18:11:00-06:00');
  addEv('m-demo-j1-2', 15, 6, 'yellow_card', 67, '2026-11-08T18:52:00-06:00');
  // Andrés Palacios (demo-p-t4-d4) played for MIR in J1 before transferring to TAL and got 2 yellows
  events.push({
    id: `demo-ev-${evIdx++}`,
    competitionId,
    matchId: 'm-demo-j1-2',
    teamId: 'demo-team-15',
    playerId: pid(4, 4),
    type: 'yellow_card',
    minute: 24,
    visibility: 'public',
    createdAt: '2026-11-08T17:54:00-06:00',
    createdBy: 'Comité Directivo SJDS',
  });
  events.push({
    id: `demo-ev-${evIdx++}`,
    competitionId,
    matchId: 'm-demo-j1-2',
    teamId: 'demo-team-15',
    playerId: pid(4, 4),
    type: 'yellow_card',
    minute: 79,
    visibility: 'public',
    createdAt: '2026-11-08T19:04:00-06:00',
    createdBy: 'Comité Directivo SJDS',
  });

  // m-demo-j1-3: MAR 8 - 1 CHO (Mateo Rivera played for MAR in J1 before transferring to TIB!)
  events.push({
    id: `demo-ev-${evIdx++}`,
    competitionId,
    matchId: 'm-demo-j1-3',
    teamId: 'demo-team-3',
    playerId: pid(1, 9),
    type: 'goal',
    minute: 11,
    visibility: 'public',
    createdAt: '2026-11-09T15:11:00-06:00',
    createdBy: 'Comité Directivo SJDS',
  });
  events.push({
    id: `demo-ev-${evIdx++}`,
    competitionId,
    matchId: 'm-demo-j1-3',
    teamId: 'demo-team-3',
    playerId: pid(1, 9),
    type: 'goal',
    minute: 27,
    visibility: 'public',
    createdAt: '2026-11-09T15:27:00-06:00',
    createdBy: 'Comité Directivo SJDS',
  });
  events.push({
    id: `demo-ev-${evIdx++}`,
    competitionId,
    matchId: 'm-demo-j1-3',
    teamId: 'demo-team-3',
    playerId: pid(1, 9),
    type: 'goal',
    minute: 44,
    visibility: 'public',
    createdAt: '2026-11-09T15:44:00-06:00',
    createdBy: 'Comité Directivo SJDS',
  });
  addEv('m-demo-j1-3', 14, 9, 'goal', 49, '2026-11-09T16:04:00-06:00');
  addEv('m-demo-j1-3', 3, 9, 'goal', 53, '2026-11-09T16:08:00-06:00');
  addEv('m-demo-j1-3', 3, 10, 'goal', 61, '2026-11-09T16:16:00-06:00');
  addEv('m-demo-j1-3', 3, 9, 'goal', 72, '2026-11-09T16:27:00-06:00');
  addEv('m-demo-j1-3', 3, 10, 'goal', 80, '2026-11-09T16:35:00-06:00');
  addEv('m-demo-j1-3', 3, 11, 'goal', 89, '2026-11-09T16:44:00-06:00');
  events.push({
    id: `demo-ev-${evIdx++}`,
    competitionId,
    matchId: 'm-demo-j1-3',
    teamId: 'demo-team-3',
    playerId: pid(1, 9),
    type: 'yellow_card',
    minute: 66,
    visibility: 'public',
    createdAt: '2026-11-09T16:21:00-06:00',
    createdBy: 'Comité Directivo SJDS',
  });
  addEv('m-demo-j1-3', 3, 6, 'yellow_card', 33, '2026-11-09T15:33:00-06:00');
  addEv('m-demo-j1-3', 3, 6, 'yellow_card', 78, '2026-11-09T16:33:00-06:00');
  addEv('m-demo-j1-3', 14, 3, 'yellow_card', 19, '2026-11-09T15:19:00-06:00');
  addEv('m-demo-j1-3', 14, 4, 'yellow_card', 54, '2026-11-09T16:09:00-06:00');
  addEv('m-demo-j1-3', 14, 8, 'yellow_card', 83, '2026-11-09T16:38:00-06:00');

  // m-demo-j1-4: TAL 5 - 3 PAC (Kevin López played for PAC in J1 before transferring to COS!)
  addEv('m-demo-j1-4', 4, 9, 'goal', 14, '2026-11-09T17:44:00-06:00');
  events.push({
    id: `demo-ev-${evIdx++}`,
    competitionId,
    matchId: 'm-demo-j1-4',
    teamId: 'demo-team-13',
    playerId: pid(7, 11),
    type: 'goal',
    minute: 23,
    visibility: 'public',
    createdAt: '2026-11-09T17:53:00-06:00',
    createdBy: 'Comité Directivo SJDS',
  });
  addEv('m-demo-j1-4', 4, 11, 'goal', 36, '2026-11-09T18:06:00-06:00');
  addEv('m-demo-j1-4', 13, 10, 'goal', 48, '2026-11-09T18:33:00-06:00');
  addEv('m-demo-j1-4', 4, 9, 'goal', 60, '2026-11-09T18:45:00-06:00');
  events.push({
    id: `demo-ev-${evIdx++}`,
    competitionId,
    matchId: 'm-demo-j1-4',
    teamId: 'demo-team-13',
    playerId: pid(7, 11),
    type: 'goal',
    minute: 69,
    visibility: 'public',
    createdAt: '2026-11-09T18:54:00-06:00',
    createdBy: 'Comité Directivo SJDS',
  });
  addEv('m-demo-j1-4', 4, 10, 'goal', 77, '2026-11-09T19:02:00-06:00');
  addEv('m-demo-j1-4', 4, 11, 'goal', 86, '2026-11-09T19:11:00-06:00');
  addEv('m-demo-j1-4', 4, 2, 'yellow_card', 31, '2026-11-09T18:01:00-06:00');
  addEv('m-demo-j1-4', 4, 5, 'yellow_card', 64, '2026-11-09T18:49:00-06:00');
  addEv('m-demo-j1-4', 4, 8, 'yellow_card', 85, '2026-11-09T19:10:00-06:00');
  addEv('m-demo-j1-4', 13, 5, 'yellow_card', 40, '2026-11-09T18:10:00-06:00');
  addEv('m-demo-j1-4', 13, 3, 'yellow_card', 69, '2026-11-09T18:54:00-06:00');
  addEv('m-demo-j1-4', 13, 6, 'yellow_card', 88, '2026-11-09T19:13:00-06:00');

  // m-demo-j1-5: EST 4 - 4 REM
  addEv('m-demo-j1-5', 5, 9, 'goal', 13, '2026-11-10T15:13:00-06:00');
  addEv('m-demo-j1-5', 6, 10, 'goal', 22, '2026-11-10T15:22:00-06:00');
  addEv('m-demo-j1-5', 5, 11, 'goal', 34, '2026-11-10T15:34:00-06:00');
  addEv('m-demo-j1-5', 6, 9, 'goal', 45, '2026-11-10T15:45:00-06:00');
  addEv('m-demo-j1-5', 5, 9, 'goal', 57, '2026-11-10T16:12:00-06:00');
  addEv('m-demo-j1-5', 6, 10, 'goal', 66, '2026-11-10T16:21:00-06:00');
  addEv('m-demo-j1-5', 5, 10, 'goal', 78, '2026-11-10T16:33:00-06:00');
  addEv('m-demo-j1-5', 6, 7, 'goal', 89, '2026-11-10T16:44:00-06:00');
  addEv('m-demo-j1-5', 5, 6, 'yellow_card', 25, '2026-11-10T15:25:00-06:00');
  addEv('m-demo-j1-5', 5, 4, 'yellow_card', 60, '2026-11-10T16:15:00-06:00');
  addEv('m-demo-j1-5', 5, 2, 'yellow_card', 81, '2026-11-10T16:36:00-06:00');
  // T6 #5 reaches 3 yellow cards in J1 -> suspended and unable to play J2 match tonight!
  addEv('m-demo-j1-5', 6, 5, 'yellow_card', 18, '2026-11-10T15:18:00-06:00');
  addEv('m-demo-j1-5', 6, 5, 'yellow_card', 52, '2026-11-10T16:07:00-06:00');
  addEv('m-demo-j1-5', 6, 5, 'yellow_card', 86, '2026-11-10T16:41:00-06:00');
  addEv('m-demo-j1-5', 6, 3, 'yellow_card', 44, '2026-11-10T15:44:00-06:00');

  // m-demo-j1-6: COS 6 - 2 MAD
  addEv('m-demo-j1-6', 7, 9, 'goal', 10, '2026-11-10T17:40:00-06:00');
  addEv('m-demo-j1-6', 7, 10, 'goal', 24, '2026-11-10T17:54:00-06:00');
  addEv('m-demo-j1-6', 8, 9, 'goal', 37, '2026-11-10T18:07:00-06:00');
  addEv('m-demo-j1-6', 7, 9, 'goal', 48, '2026-11-10T18:33:00-06:00');
  addEv('m-demo-j1-6', 7, 7, 'goal', 61, '2026-11-10T18:46:00-06:00');
  addEv('m-demo-j1-6', 8, 11, 'goal', 70, '2026-11-10T18:55:00-06:00');
  addEv('m-demo-j1-6', 7, 10, 'goal', 81, '2026-11-10T19:06:00-06:00');
  addEv('m-demo-j1-6', 7, 9, 'goal', 89, '2026-11-10T19:14:00-06:00');
  addEv('m-demo-j1-6', 7, 4, 'yellow_card', 23, '2026-11-10T17:53:00-06:00');
  addEv('m-demo-j1-6', 7, 6, 'yellow_card', 71, '2026-11-10T18:56:00-06:00');
  // T8 #4 reaches 3 yellow cards in J1 -> suspended for upcoming J2 match!
  addEv('m-demo-j1-6', 8, 4, 'yellow_card', 15, '2026-11-10T17:45:00-06:00');
  addEv('m-demo-j1-6', 8, 4, 'yellow_card', 49, '2026-11-10T18:34:00-06:00');
  addEv('m-demo-j1-6', 8, 4, 'yellow_card', 84, '2026-11-10T19:09:00-06:00');
  addEv('m-demo-j1-6', 8, 5, 'yellow_card', 63, '2026-11-10T18:48:00-06:00');

  // m-demo-j1-7: CAR 2 - 5 OST
  addEv('m-demo-j1-7', 10, 9, 'goal', 16, '2026-11-11T15:46:00-06:00');
  addEv('m-demo-j1-7', 9, 9, 'goal', 28, '2026-11-11T15:58:00-06:00');
  addEv('m-demo-j1-7', 10, 7, 'goal', 42, '2026-11-11T16:12:00-06:00');
  addEv('m-demo-j1-7', 10, 9, 'goal', 58, '2026-11-11T16:43:00-06:00');
  addEv('m-demo-j1-7', 9, 10, 'goal', 69, '2026-11-11T16:54:00-06:00');
  addEv('m-demo-j1-7', 10, 11, 'goal', 77, '2026-11-11T17:02:00-06:00');
  addEv('m-demo-j1-7', 10, 7, 'goal', 85, '2026-11-11T17:10:00-06:00');
  addEv('m-demo-j1-7', 9, 5, 'yellow_card', 27, '2026-11-11T15:57:00-06:00');
  addEv('m-demo-j1-7', 9, 5, 'yellow_card', 73, '2026-11-11T16:58:00-06:00');
  addEv('m-demo-j1-7', 9, 3, 'yellow_card', 44, '2026-11-11T16:14:00-06:00');
  addEv('m-demo-j1-7', 9, 4, 'yellow_card', 88, '2026-11-11T17:13:00-06:00');
  addEv('m-demo-j1-7', 10, 4, 'yellow_card', 36, '2026-11-11T16:06:00-06:00');
  addEv('m-demo-j1-7', 10, 6, 'yellow_card', 68, '2026-11-11T16:53:00-06:00');
  addEv('m-demo-j1-7', 10, 8, 'yellow_card', 82, '2026-11-11T17:07:00-06:00');

  // m-demo-j1-8: DEL 3 - 3 ESC
  addEv('m-demo-j1-8', 11, 9, 'goal', 14, '2026-11-11T17:44:00-06:00');
  addEv('m-demo-j1-8', 12, 9, 'goal', 29, '2026-11-11T17:59:00-06:00');
  addEv('m-demo-j1-8', 11, 10, 'goal', 43, '2026-11-11T18:13:00-06:00');
  addEv('m-demo-j1-8', 12, 11, 'goal', 56, '2026-11-11T18:41:00-06:00');
  addEv('m-demo-j1-8', 11, 9, 'goal', 71, '2026-11-11T18:56:00-06:00');
  addEv('m-demo-j1-8', 12, 9, 'goal', 84, '2026-11-11T19:09:00-06:00');
  addEv('m-demo-j1-8', 11, 4, 'yellow_card', 21, '2026-11-11T17:51:00-06:00');
  addEv('m-demo-j1-8', 11, 5, 'yellow_card', 59, '2026-11-11T18:44:00-06:00');
  addEv('m-demo-j1-8', 11, 3, 'yellow_card', 87, '2026-11-11T19:12:00-06:00');
  // T12 #4 reaches 3 yellow cards in J1 -> suspended for upcoming J2 match!
  addEv('m-demo-j1-8', 12, 4, 'yellow_card', 16, '2026-11-11T17:46:00-06:00');
  addEv('m-demo-j1-8', 12, 4, 'yellow_card', 53, '2026-11-11T18:38:00-06:00');
  addEv('m-demo-j1-8', 12, 4, 'yellow_card', 89, '2026-11-11T19:14:00-06:00');
  addEv('m-demo-j1-8', 12, 6, 'yellow_card', 72, '2026-11-11T18:57:00-06:00');

  // J2 finalized matches
  // m-demo-j2-1: BAS 1 - 7 NAC
  addEv('m-demo-j2-1', 2, 9, 'goal', 9, '2026-11-15T15:09:00-06:00');
  addEv('m-demo-j2-1', 2, 10, 'goal', 21, '2026-11-15T15:21:00-06:00');
  addEv('m-demo-j2-1', 16, 9, 'goal', 34, '2026-11-15T15:34:00-06:00');
  addEv('m-demo-j2-1', 2, 9, 'goal', 47, '2026-11-15T16:02:00-06:00');
  addEv('m-demo-j2-1', 2, 11, 'goal', 59, '2026-11-15T16:14:00-06:00');
  addEv('m-demo-j2-1', 2, 10, 'goal', 68, '2026-11-15T16:23:00-06:00');
  addEv('m-demo-j2-1', 2, 9, 'goal', 78, '2026-11-15T16:33:00-06:00');
  addEv('m-demo-j2-1', 2, 7, 'goal', 88, '2026-11-15T16:43:00-06:00');
  // T2 #5 reaches 3 yellows (1 in J1 + 2 in J2) -> suspended!
  addEv('m-demo-j2-1', 2, 5, 'yellow_card', 40, '2026-11-15T15:40:00-06:00');
  addEv('m-demo-j2-1', 2, 5, 'yellow_card', 82, '2026-11-15T16:37:00-06:00');
  addEv('m-demo-j2-1', 2, 6, 'yellow_card', 61, '2026-11-15T16:16:00-06:00');
  addEv('m-demo-j2-1', 16, 4, 'yellow_card', 31, '2026-11-15T15:31:00-06:00');
  addEv('m-demo-j2-1', 16, 5, 'yellow_card', 58, '2026-11-15T16:13:00-06:00');
  addEv('m-demo-j2-1', 16, 2, 'yellow_card', 76, '2026-11-15T16:31:00-06:00');

  // m-demo-j2-2: MIR 2 - 9 MAR
  addEv('m-demo-j2-2', 3, 9, 'goal', 7, '2026-11-15T17:37:00-06:00');
  addEv('m-demo-j2-2', 3, 10, 'goal', 15, '2026-11-15T17:45:00-06:00');
  addEv('m-demo-j2-2', 15, 9, 'goal', 24, '2026-11-15T17:54:00-06:00');
  addEv('m-demo-j2-2', 3, 9, 'goal', 33, '2026-11-15T18:03:00-06:00');
  addEv('m-demo-j2-2', 3, 10, 'goal', 42, '2026-11-15T18:12:00-06:00');
  addEv('m-demo-j2-2', 3, 9, 'goal', 53, '2026-11-15T18:38:00-06:00');
  addEv('m-demo-j2-2', 15, 11, 'goal', 60, '2026-11-15T18:45:00-06:00');
  addEv('m-demo-j2-2', 3, 11, 'goal', 68, '2026-11-15T18:53:00-06:00');
  addEv('m-demo-j2-2', 3, 10, 'goal', 75, '2026-11-15T19:00:00-06:00');
  addEv('m-demo-j2-2', 3, 9, 'goal', 82, '2026-11-15T19:07:00-06:00');
  addEv('m-demo-j2-2', 3, 7, 'goal', 90, '2026-11-15T19:15:00-06:00');
  // T15 #3 reaches 3 yellows (1 in J1 + 2 in J2) -> suspended!
  addEv('m-demo-j2-2', 15, 3, 'yellow_card', 28, '2026-11-15T17:58:00-06:00');
  addEv('m-demo-j2-2', 15, 3, 'yellow_card', 74, '2026-11-15T18:59:00-06:00');
  addEv('m-demo-j2-2', 15, 6, 'yellow_card', 55, '2026-11-15T18:40:00-06:00');
  // T3 #6 reaches 3 yellows (2 in J1 + 1 in J2) -> suspended!
  addEv('m-demo-j2-2', 3, 6, 'yellow_card', 47, '2026-11-15T18:32:00-06:00');
  addEv('m-demo-j2-2', 3, 4, 'yellow_card', 69, '2026-11-15T18:54:00-06:00');

  // m-demo-j2-3: CHO 1 - 8 EST
  addEv('m-demo-j2-3', 5, 9, 'goal', 10, '2026-11-16T09:40:00-06:00');
  addEv('m-demo-j2-3', 5, 11, 'goal', 19, '2026-11-16T09:49:00-06:00');
  addEv('m-demo-j2-3', 14, 10, 'goal', 28, '2026-11-16T09:58:00-06:00');
  addEv('m-demo-j2-3', 5, 9, 'goal', 39, '2026-11-16T10:09:00-06:00');
  addEv('m-demo-j2-3', 5, 10, 'goal', 51, '2026-11-16T10:36:00-06:00');
  addEv('m-demo-j2-3', 5, 11, 'goal', 62, '2026-11-16T10:47:00-06:00');
  addEv('m-demo-j2-3', 5, 10, 'goal', 74, '2026-11-16T10:59:00-06:00');
  addEv('m-demo-j2-3', 5, 9, 'goal', 81, '2026-11-16T11:06:00-06:00');
  addEv('m-demo-j2-3', 5, 11, 'goal', 88, '2026-11-16T11:13:00-06:00');
  // T5 #6 reaches 3 yellows (1 in J1 + 2 in J2) -> suspended!
  addEv('m-demo-j2-3', 5, 6, 'yellow_card', 24, '2026-11-16T09:54:00-06:00');
  addEv('m-demo-j2-3', 5, 6, 'yellow_card', 77, '2026-11-16T11:02:00-06:00');
  addEv('m-demo-j2-3', 5, 5, 'yellow_card', 50, '2026-11-16T10:35:00-06:00');
  addEv('m-demo-j2-3', 14, 3, 'yellow_card', 34, '2026-11-16T10:04:00-06:00');
  addEv('m-demo-j2-3', 14, 4, 'yellow_card', 61, '2026-11-16T10:46:00-06:00');
  addEv('m-demo-j2-3', 14, 2, 'red_card', 67, '2026-11-16T10:52:00-06:00', 'Conducta violenta en disputa de balón');

  // m-demo-j2-4: PAC 2 - 7 COS
  addEv('m-demo-j2-4', 7, 11, 'goal', 11, '2026-11-16T11:41:00-06:00');
  addEv('m-demo-j2-4', 7, 9, 'goal', 21, '2026-11-16T11:51:00-06:00');
  addEv('m-demo-j2-4', 13, 9, 'goal', 32, '2026-11-16T12:02:00-06:00');
  addEv('m-demo-j2-4', 7, 11, 'goal', 43, '2026-11-16T12:13:00-06:00');
  addEv('m-demo-j2-4', 7, 9, 'goal', 54, '2026-11-16T12:39:00-06:00');
  addEv('m-demo-j2-4', 13, 10, 'goal', 63, '2026-11-16T12:48:00-06:00');
  addEv('m-demo-j2-4', 7, 11, 'goal', 71, '2026-11-16T12:56:00-06:00');
  addEv('m-demo-j2-4', 7, 9, 'goal', 80, '2026-11-16T13:05:00-06:00');
  addEv('m-demo-j2-4', 7, 10, 'goal', 88, '2026-11-16T13:13:00-06:00');
  // T13 #5 reaches 3 yellows (1 in J1 + 2 in J2) -> suspended!
  addEv('m-demo-j2-4', 13, 5, 'yellow_card', 37, '2026-11-16T12:07:00-06:00');
  addEv('m-demo-j2-4', 13, 5, 'yellow_card', 81, '2026-11-16T13:06:00-06:00');
  addEv('m-demo-j2-4', 13, 3, 'yellow_card', 63, '2026-11-16T12:48:00-06:00');
  addEv('m-demo-j2-4', 7, 4, 'yellow_card', 45, '2026-11-16T12:15:00-06:00');
  addEv('m-demo-j2-4', 7, 6, 'yellow_card', 72, '2026-11-16T12:57:00-06:00');
  addEv('m-demo-j2-4', 7, 2, 'yellow_card', 86, '2026-11-16T13:11:00-06:00');

  // m-demo-j2-5: EN JUEGO (PAUSADO 63:24 - 2do tiempo) TIB 3 - 1 TAL
  addEv('m-demo-j2-5', 1, 9, 'goal', 15, '2026-11-16T15:45:00-06:00');
  addEv('m-demo-j2-5', 1, 10, 'goal', 34, '2026-11-16T16:04:00-06:00');
  addEv('m-demo-j2-5', 4, 9, 'goal', 41, '2026-11-16T16:11:00-06:00');
  addEv('m-demo-j2-5', 1, 9, 'goal', 56, '2026-11-16T16:41:00-06:00');
  // Andrés Palacios (T4 #4) receives his 3rd yellow (2 in J1 with MIR + 1 here) -> suspended!
  addEv('m-demo-j2-5', 4, 4, 'yellow_card', 28, '2026-11-16T15:58:00-06:00');
  addEv('m-demo-j2-5', 4, 2, 'yellow_card', 52, '2026-11-16T16:37:00-06:00');
  addEv('m-demo-j2-5', 1, 4, 'yellow_card', 47, '2026-11-16T16:32:00-06:00');
  addEv('m-demo-j2-5', 1, 9, 'yellow_card', 59, '2026-11-16T16:44:00-06:00');
  events.push({
    id: `demo-ev-${evIdx++}`,
    competitionId,
    matchId: 'm-demo-j2-5',
    teamId: 'demo-team-1',
    type: 'special_note',
    minute: 64,
    note: 'Partido pausado momentáneamente por atención médica en el segundo tiempo.',
    visibility: 'public',
    createdAt: '2026-11-16T16:49:00-06:00',
    createdBy: 'Comité Directivo SJDS',
  });

  // Exaggerated standings bonuses/adjustments for Liga Demo
  const pointAdjustments: PointAdjustment[] = [
    {
      id: 'demo-adj-1',
      competitionId,
      teamId: 'demo-team-3',
      deltaPoints: 6,
      reason: 'Bonificación oficial por título invicto en Copa Apertura SJDS',
      createdAt: '2026-11-07T12:00:00-06:00',
      createdBy: 'Comité Directivo SJDS',
    },
    {
      id: 'demo-adj-2',
      competitionId,
      teamId: 'demo-team-2',
      deltaPoints: 3,
      reason: 'Bonificación oficial por clasificación directa y juego limpio previo',
      createdAt: '2026-11-07T12:15:00-06:00',
      createdBy: 'Comité Directivo SJDS',
    },
    {
      id: 'demo-adj-3',
      competitionId,
      teamId: 'demo-team-7',
      deltaPoints: 3,
      reason: 'Bonificación oficial por cuadrangular clasificatoria',
      createdAt: '2026-11-07T12:30:00-06:00',
      createdBy: 'Comité Directivo SJDS',
    },
  ];

  // Realistic transfer history recorded in auditLogs (feeds both NewsTicker and PlayerProfileModal)
  const auditLogs: AuditLogEntry[] = [
    {
      id: 'demo-aud-tr-1',
      competitionId,
      action: 'Transferencia de jugador',
      entityType: 'player',
      entityId: pid(1, 9),
      previousValue: '#11 Mateo Rivera (Deportivo Marsella)',
      newValue: '#9 Mateo Rivera (Tiburones de San Juan)',
      reason: 'Fichaje estelar para refuerzo ofensivo en Jornada 2',
      actorName: 'Javier Morales',
      actorRole: 'dt',
      createdAt: '2026-11-12T10:15:00-06:00',
    },
    {
      id: 'demo-aud-tr-2',
      competitionId,
      action: 'Transferencia de jugador',
      entityType: 'player',
      entityId: pid(2, 10),
      previousValue: '#8 Luis Vargas (Corsarios El Bastón)',
      newValue: '#10 Luis Vargas (Atlético Nacascolo)',
      reason: 'Traspaso oficial tras cierre de la primera fecha',
      actorName: 'Miguel Ángel Torres',
      actorRole: 'dt',
      createdAt: '2026-11-12T14:30:00-06:00',
    },
    {
      id: 'demo-aud-tr-3',
      competitionId,
      action: 'Transferencia de jugador',
      entityType: 'player',
      entityId: pid(7, 11),
      previousValue: '#9 Kevin López (Marinos del Pacífico)',
      newValue: '#11 Kevin López (Costa Brava FC)',
      reason: 'Cesión definitiva aprobada entre directivas',
      actorName: 'Fernando López',
      actorRole: 'dt',
      createdAt: '2026-11-13T11:00:00-06:00',
    },
    {
      id: 'demo-aud-tr-4',
      competitionId,
      action: 'Transferencia de jugador',
      entityType: 'player',
      entityId: pid(4, 4),
      previousValue: '#5 Andrés Palacios (Cóndores Miravalles)',
      newValue: '#4 Andrés Palacios (Real Talanguera)',
      reason: 'Incorporación defensiva previo a la jornada 2',
      actorName: 'Julio César Rivas',
      actorRole: 'dt',
      createdAt: '2026-11-14T09:45:00-06:00',
    },
  ];

  return {
    competition,
    teams,
    players,
    matches,
    events,
    pointAdjustments,
    auditLogs,
  };
}

function buildHeroesYMartiresData() {
  const competitionId = 'liga-heroes-y-martires';

  const competition: Competition = {
    id: competitionId,
    name: 'Liga Héroes y Mártires',
    season: 'Inicia 1 de diciembre 2026',
    category: '16 Clubes · Primera División',
    status: 'active',
    rules: {
      maxActivePlayers: 25,
      yellowAccumulationLimit: 3,
      redCardSuspensionMatches: 2,
      registrationOpen: true,
      registrationDeadline: '2026-11-30',
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
    },
  };

  const teams: Team[] = Array.from({ length: 16 }, (_, idx) => {
    const num = idx + 1;
    const palette = TEAM_PALETTES[idx % TEAM_PALETTES.length];
    const shortNum = num < 10 ? `E0${num}` : `E${num}`;
    return {
      id: `team-${num}`,
      competitionId,
      name: `Equipo ${num}`,
      shortName: shortNum,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      motif: palette.motif,
      dtName: `DT Equipo ${num}`,
      dtUserId: num === 1 ? 'user-dt-1' : num === 2 ? 'user-dt-2' : undefined,
      neighborhood: palette.zone,
    };
  });

  const players: Player[] = [];
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const num = i + 1;
    for (const tpl of STARTER_ROSTER_TEMPLATE) {
      players.push({
        id: `p-t${num}-d${tpl.dorsal}`,
        teamId: team.id,
        competitionId,
        name: `${tpl.name} (${team.shortName})`,
        dorsal: tpl.dorsal,
        primaryPosition: tpl.primaryPosition,
        status: 'active',
        joinedAt: '2026-11-16',
      });
    }
  }

  const matchKickoffs = [
    { kickoff: '2026-12-01T15:30:00-06:00', venue: 'Estadio Municipal SJDS' },
    { kickoff: '2026-12-01T17:30:00-06:00', venue: 'Estadio Municipal SJDS' },
    { kickoff: '2026-12-01T19:30:00-06:00', venue: 'Estadio Municipal SJDS' },
    { kickoff: '2026-12-02T15:30:00-06:00', venue: 'Cancha El Remanso' },
    { kickoff: '2026-12-02T17:30:00-06:00', venue: 'Cancha Playa Marsella' },
    { kickoff: '2026-12-03T15:30:00-06:00', venue: 'Estadio Municipal SJDS' },
    { kickoff: '2026-12-03T17:30:00-06:00', venue: 'Cancha El Remanso' },
    { kickoff: '2026-12-04T16:00:00-06:00', venue: 'Estadio Municipal SJDS' },
  ];

  const matches: Match[] = matchKickoffs.map((slot, idx) => ({
    id: `m-hym-${idx + 1}`,
    competitionId,
    jornada: 1,
    homeTeamId: `team-${idx * 2 + 1}`,
    awayTeamId: `team-${idx * 2 + 2}`,
    kickoffAt: slot.kickoff,
    venue: slot.venue,
    status: 'programado',
    homeScore: 0,
    awayScore: 0,
    referee: 'Por designar',
  }));

  return {
    competition,
    teams,
    players,
    matches,
    events: [] as MatchEvent[],
    auditLogs: [] as AuditLogEntry[],
  };
}

export function createSeedDatabase(): LeagueDatabase {
  const demo = buildDemoLeagueData();
  const heroes = buildHeroesYMartiresData();

  const users: UserAccount[] = [
    {
      id: 'user-admin-1',
      email: 'admin@ligasjds.ni',
      passwordHash: hashPassword('AdminSJDS2026!'),
      name: 'Comité Directivo SJDS',
      role: 'admin',
    },
    {
      id: 'user-dt-demo-1',
      email: 'dt.tiburones@ligasjds.ni',
      passwordHash: hashPassword('Tiburones2026!'),
      name: 'Carlos Mendoza (Tiburones)',
      role: 'dt',
      assignedTeamId: 'demo-team-1',
    },
    {
      id: 'user-dt-1',
      email: 'dt.equipo1@ligasjds.ni',
      passwordHash: hashPassword('Equipo1SJDS!'),
      name: 'DT Equipo 1',
      role: 'dt',
      assignedTeamId: 'team-1',
    },
    {
      id: 'user-dt-2',
      email: 'dt.equipo2@ligasjds.ni',
      passwordHash: hashPassword('Equipo2SJDS!'),
      name: 'DT Equipo 2',
      role: 'dt',
      assignedTeamId: 'team-2',
    },
  ];

  return {
    seedVersion: CURRENT_SEED_VERSION,
    isDemoData: true,
    competitions: [demo.competition, heroes.competition],
    teams: [...demo.teams, ...heroes.teams],
    players: [...demo.players, ...heroes.players],
    matches: [...demo.matches, ...heroes.matches],
    events: [...demo.events, ...heroes.events],
    pointAdjustments: [...demo.pointAdjustments],
    suspensionOverrides: [],
    auditLogs: [...demo.auditLogs, ...heroes.auditLogs],
    users,
  };
}
