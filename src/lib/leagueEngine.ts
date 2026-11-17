import type {
  CompetitionRules,
  DisciplinePlayerRow,
  Match,
  MatchEvent,
  Player,
  PointAdjustment,
  PositionCode,
  PublicTransferNotice,
  ScorerRow,
  StandingsRow,
  SuspensionOverride,
  Team,
  TickerNewsItem,
} from '../types/league';

export const POSITION_LABELS: Record<PositionCode, string> = {
  POR: 'Portero',
  DEF: 'Defensa',
  MED: 'Mediocampista',
  DEL: 'Delantero',
};

export const POSITION_ORDER: Record<PositionCode, number> = {
  POR: 0,
  DEF: 1,
  MED: 2,
  DEL: 3,
};

export const MAX_STARTERS = 11;

export function getPositionLabel(code?: PositionCode): string {
  if (!code) return '';
  return POSITION_LABELS[code] ?? code;
}

export function sortPlayersByLineupOrder(list: Player[]): Player[] {
  return list.slice().sort((a, b) => {
    const posDiff = (POSITION_ORDER[a.primaryPosition] ?? 9) - (POSITION_ORDER[b.primaryPosition] ?? 9);
    if (posDiff !== 0) return posDiff;
    return a.dorsal - b.dorsal;
  });
}

export function getTeamStarters(
  team: Pick<Team, 'id' | 'starterPlayerIds'>,
  players: Player[]
): Player[] {
  const starterIds = team.starterPlayerIds ?? [];
  if (starterIds.length === 0) return [];

  const activeTeamPlayerById = new Map(
    players
      .filter((p) => p.teamId === team.id && p.status === 'active')
      .map((p) => [p.id, p])
  );

  const seen = new Set<string>();
  const starters: Player[] = [];
  for (const id of starterIds) {
    if (seen.has(id)) continue;
    const player = activeTeamPlayerById.get(id);
    if (!player) continue;
    seen.add(id);
    starters.push(player);
    if (starters.length >= MAX_STARTERS) break;
  }

  return sortPlayersByLineupOrder(starters);
}

export function validateTeamStarters(
  teamPlayers: Player[],
  starterPlayerIds: string[]
): { ok: boolean; error?: string } {
  if (!Array.isArray(starterPlayerIds)) {
    return { ok: false, error: 'Lista de titulares inválida.' };
  }

  const seen = new Set<string>();
  for (const id of starterPlayerIds) {
    if (typeof id !== 'string' || !id.trim()) {
      return { ok: false, error: 'Identificador de jugador titular inválido.' };
    }
    if (seen.has(id)) {
      return { ok: false, error: 'No puedes incluir al mismo jugador dos veces como titular.' };
    }
    seen.add(id);
  }

  if (starterPlayerIds.length > MAX_STARTERS) {
    return {
      ok: false,
      error: `Solo se permiten hasta ${MAX_STARTERS} jugadores titulares por equipo.`,
    };
  }

  const playerById = new Map(teamPlayers.map((p) => [p.id, p]));
  for (const id of starterPlayerIds) {
    const player = playerById.get(id);
    if (!player) {
      return {
        ok: false,
        error: 'Uno de los jugadores seleccionados no pertenece a este club.',
      };
    }
    if (player.status !== 'active') {
      return {
        ok: false,
        error: `${player.name} está dado de baja y no puede figurar entre los titulares.`,
      };
    }
  }

  return { ok: true };
}

export function calculateStandings(
  teams: Team[],
  matches: Match[],
  pointAdjustments: PointAdjustment[],
  rules: Pick<CompetitionRules, 'pointsWin' | 'pointsDraw' | 'pointsLoss'> = {
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
  }
): StandingsRow[] {
  const rowMap = new Map<string, StandingsRow>();

  for (const team of teams) {
    rowMap.set(team.id, {
      position: 0,
      teamId: team.id,
      teamName: team.name,
      shortName: team.shortName,
      primaryColor: team.primaryColor,
      secondaryColor: team.secondaryColor,
      motif: team.motif,
      logoUrl: team.logoUrl,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      dif: 0,
      basePts: 0,
      adjustmentPts: 0,
      pts: 0,
      adjustmentReasons: [],
      form: [],
      eliminated: Boolean(team.eliminated),
    });
  }

  // Only completed or live matches count? Official standings count finalized matches;
  // live matches can be shown on scoreboard, while finalized matches lock into official standings.
  const countedMatches = matches
    .filter((m) => m.status === 'finalizado')
    .slice()
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());

  for (const match of countedMatches) {
    const home = rowMap.get(match.homeTeamId);
    const away = rowMap.get(match.awayTeamId);
    if (!home || !away) continue;

    home.pj += 1;
    away.pj += 1;
    home.gf += match.homeScore;
    home.gc += match.awayScore;
    away.gf += match.awayScore;
    away.gc += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.pg += 1;
      home.basePts += rules.pointsWin;
      home.form.push('G');

      away.pp += 1;
      away.basePts += rules.pointsLoss;
      away.form.push('P');
    } else if (match.homeScore < match.awayScore) {
      away.pg += 1;
      away.basePts += rules.pointsWin;
      away.form.push('G');

      home.pp += 1;
      home.basePts += rules.pointsLoss;
      home.form.push('P');
    } else {
      home.pe += 1;
      home.basePts += rules.pointsDraw;
      home.form.push('E');

      away.pe += 1;
      away.basePts += rules.pointsDraw;
      away.form.push('E');
    }
  }

  for (const adj of pointAdjustments) {
    const row = rowMap.get(adj.teamId);
    if (!row) continue;
    row.adjustmentPts += adj.deltaPoints;
    row.adjustmentReasons.push(
      `${adj.deltaPoints >= 0 ? `+${adj.deltaPoints}` : adj.deltaPoints} pts: ${adj.reason}`
    );
  }

  const rows = Array.from(rowMap.values()).map((row) => ({
    ...row,
    dif: row.gf - row.gc,
    pts: row.basePts + row.adjustmentPts,
    form: row.form.slice(-5),
  }));

  rows.sort((a, b) => {
    if (Boolean(a.eliminated) !== Boolean(b.eliminated)) return a.eliminated ? 1 : -1;
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dif !== a.dif) return b.dif - a.dif;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.teamName.localeCompare(b.teamName, 'es', { numeric: true });
  });

  return rows.map((row, index) => ({
    ...row,
    position: index + 1,
  }));
}

export function calculateTopScorers(
  players: Player[],
  teams: Team[],
  matches: Match[],
  events: MatchEvent[]
): ScorerRow[] {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const playerById = new Map(players.map((p) => [p.id, p]));
  const teamPlayedCount = new Map<string, number>();

  for (const match of matches) {
    if (match.status === 'finalizado' || match.status === 'en_juego') {
      teamPlayedCount.set(match.homeTeamId, (teamPlayedCount.get(match.homeTeamId) ?? 0) + 1);
      teamPlayedCount.set(match.awayTeamId, (teamPlayedCount.get(match.awayTeamId) ?? 0) + 1);
    }
  }

  const goalCounts = new Map<string, number>();
  for (const event of events) {
    if (event.type === 'goal' && event.playerId) {
      goalCounts.set(event.playerId, (goalCounts.get(event.playerId) ?? 0) + 1);
    }
  }

  const rows: ScorerRow[] = [];
  for (const [playerId, goals] of goalCounts.entries()) {
    if (goals <= 0) continue;
    const player = playerById.get(playerId);
    if (!player) continue;
    const team = teamById.get(player.teamId);
    if (!team) continue;

    rows.push({
      position: 0,
      playerId: player.id,
      playerName: player.name,
      playerStatus: player.status,
      dorsal: player.dorsal,
      primaryPosition: player.primaryPosition,
      teamId: team.id,
      teamName: team.name,
      teamShortName: team.shortName,
      teamPrimaryColor: team.primaryColor,
      teamSecondaryColor: team.secondaryColor,
      teamMotif: team.motif,
      teamLogoUrl: team.logoUrl,
      goals,
      matchesPlayed: teamPlayedCount.get(team.id) ?? 0,
    });
  }

  rows.sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed;
    return a.playerName.localeCompare(b.playerName, 'es');
  });

  return rows.map((row, idx) => ({
    ...row,
    position: idx + 1,
  }));
}

export function calculateDisciplineSummary(
  players: Player[],
  teams: Team[],
  matches: Match[],
  events: MatchEvent[],
  rules: Pick<CompetitionRules, 'yellowAccumulationLimit' | 'redCardSuspensionMatches'>,
  suspensionOverrides: SuspensionOverride[] = [],
  includeInternalNotes = false
): DisciplinePlayerRow[] {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const matchById = new Map(matches.map((m) => [m.id, m]));
  const overrideByPlayer = new Map(suspensionOverrides.map((o) => [o.playerId, o]));

  const playerEvents = new Map<
    string,
    {
      yellows: MatchEvent[];
      reds: MatchEvent[];
      notes: MatchEvent[];
    }
  >();

  for (const ev of events) {
    if (!ev.playerId) continue;
    if (!playerEvents.has(ev.playerId)) {
      playerEvents.set(ev.playerId, { yellows: [], reds: [], notes: [] });
    }
    const bucket = playerEvents.get(ev.playerId)!;
    if (ev.type === 'yellow_card') bucket.yellows.push(ev);
    else if (ev.type === 'red_card') bucket.reds.push(ev);
    else if (ev.type === 'special_note') {
      if (includeInternalNotes || ev.visibility === 'public') {
        bucket.notes.push(ev);
      }
    }
  }

  const rows: DisciplinePlayerRow[] = [];
  const yellowLimit = Math.max(1, rules.yellowAccumulationLimit);

  for (const player of players) {
    const bucket = playerEvents.get(player.id);
    const override = overrideByPlayer.get(player.id);
    if (!bucket && !override) continue;

    const team = teamById.get(player.teamId);
    if (!team) continue;

    const yellowCards = bucket?.yellows.length ?? 0;
    const redCards = bucket?.reds.length ?? 0;
    const notes = bucket?.notes ?? [];

    if (yellowCards === 0 && redCards === 0 && notes.length === 0 && !override) {
      continue;
    }

    // Yellow accumulation cycles: e.g. limit = 3 -> 3rd yellow resets cycle & triggers 1 match suspension
    const yellowCycleCount = yellowCards === 0 ? 0 : yellowCards % yellowLimit || yellowLimit;
    const yellowUntilSuspension =
      yellowCards > 0 && yellowCards % yellowLimit === 0 ? 0 : yellowLimit - (yellowCards % yellowLimit);

    // Check matches played by the player's team AFTER the card event to compute served matches
    const teamFinalizedMatches = matches
      .filter((m) => m.status === 'finalizado' && (m.homeTeamId === team.id || m.awayTeamId === team.id))
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());

    let computedPending = 0;
    let suspensionReason: string | undefined;

    // Last red card check
    if (redCards > 0) {
      const sortedReds = bucket!.reds
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const lastRed = sortedReds[sortedReds.length - 1];
      const redMatch = matchById.get(lastRed.matchId);
      if (redMatch) {
        const matchesAfterRed = teamFinalizedMatches.filter(
          (m) => new Date(m.kickoffAt).getTime() > new Date(redMatch.kickoffAt).getTime()
        ).length;
        const remaining = Math.max(0, rules.redCardSuspensionMatches - matchesAfterRed);
        if (remaining > 0) {
          computedPending += remaining;
          suspensionReason = `Tarjeta roja directa (${rules.redCardSuspensionMatches} partidos)`;
        }
      }
    }

    // Yellow cycle suspension check
    if (yellowCards >= yellowLimit && yellowCards % yellowLimit === 0) {
      const sortedYellows = bucket!.yellows
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const triggerYellow = sortedYellows[sortedYellows.length - 1];
      const yellowMatch = matchById.get(triggerYellow.matchId);
      if (yellowMatch) {
        const matchesAfterYellow = teamFinalizedMatches.filter(
          (m) => new Date(m.kickoffAt).getTime() > new Date(yellowMatch.kickoffAt).getTime()
        ).length;
        if (matchesAfterYellow === 0) {
          computedPending += 1;
          suspensionReason = suspensionReason
            ? `${suspensionReason} + acumulación de ${yellowLimit} amarillas`
            : `Acumulación de ${yellowLimit} tarjetas amarillas`;
        }
      }
    }

    const pendingMatches = override ? override.matchesRemaining : computedPending;
    const isSuspended = pendingMatches > 0;

    if (override && override.matchesRemaining > 0 && !suspensionReason) {
      suspensionReason = override.note || 'Sanción disciplinaria oficial';
    }

    rows.push({
      playerId: player.id,
      playerName: player.name,
      playerStatus: player.status,
      dorsal: player.dorsal,
      teamId: team.id,
      teamName: team.name,
      teamShortName: team.shortName,
      teamPrimaryColor: team.primaryColor,
      yellowCards,
      yellowCycleCount,
      yellowUntilSuspension,
      redCards,
      isSuspended,
      suspensionReason: isSuspended ? suspensionReason : undefined,
      pendingMatches,
      validatedByAdmin: override ? override.validated : redCards === 0 && pendingMatches === 0,
      publicNotes: notes
        .filter((n) => n.note)
        .map((n) => ({
          id: n.id,
          matchId: n.matchId,
          minute: n.minute,
          note: n.note!,
          createdAt: n.createdAt,
        })),
    });
  }

  rows.sort((a, b) => {
    if (a.isSuspended !== b.isSuspended) return a.isSuspended ? -1 : 1;
    if (b.pendingMatches !== a.pendingMatches) return b.pendingMatches - a.pendingMatches;
    if (b.redCards !== a.redCards) return b.redCards - a.redCards;
    if (b.yellowCards !== a.yellowCards) return b.yellowCards - a.yellowCards;
    return a.playerName.localeCompare(b.playerName, 'es');
  });

  return rows;
}

export interface RosterValidationResult {
  ok: boolean;
  error?: string;
}

export function validateRosterMutation(
  teamPlayers: Player[],
  action: 'add' | 'reactivate' | 'update' | 'archive',
  rules: Pick<CompetitionRules, 'maxActivePlayers' | 'registrationOpen' | 'registrationDeadline'>,
  payload: {
    dorsal?: number;
    playerId?: string;
    name?: string;
    nowIso?: string;
  }
): RosterValidationResult {
  const nowDate = (payload.nowIso ?? new Date().toISOString()).slice(0, 10);
  const activePlayers = teamPlayers.filter((p) => p.status === 'active');

  if (action === 'add' || action === 'reactivate') {
    if (!rules.registrationOpen) {
      return {
        ok: false,
        error: 'El período de inscripción de plantillas está cerrado por administración.',
      };
    }
    if (rules.registrationDeadline && nowDate > rules.registrationDeadline) {
      return {
        ok: false,
        error: `El plazo límite de inscripción (${rules.registrationDeadline}) ha vencido.`,
      };
    }
    if (activePlayers.length >= rules.maxActivePlayers) {
      return {
        ok: false,
        error: `Cupo máximo alcanzado: el plantel ya cuenta con ${rules.maxActivePlayers} jugadores activos.`,
      };
    }
  }

  if (action === 'add') {
    if (!payload.name || payload.name.trim().length < 2) {
      return {
        ok: false,
        error: 'El nombre del jugador debe tener al menos 2 caracteres.',
      };
    }
  }

  if (payload.dorsal !== undefined) {
    if (!Number.isInteger(payload.dorsal) || payload.dorsal < 1 || payload.dorsal > 99) {
      return {
        ok: false,
        error: 'El dorsal debe ser un número entero entre 1 y 99.',
      };
    }
    const dorsalConflict = activePlayers.find(
      (p) => p.dorsal === payload.dorsal && p.id !== payload.playerId
    );
    if (dorsalConflict) {
      return {
        ok: false,
        error: `El dorsal #${payload.dorsal} ya está asignado a ${dorsalConflict.name}.`,
      };
    }
  }

  return { ok: true };
}

export function findNextAvailableDorsal(
  teamPlayers: Player[],
  preferredDorsal?: number
): number {
  const taken = new Set(
    teamPlayers.filter((p) => p.status === 'active').map((p) => p.dorsal)
  );
  if (
    preferredDorsal !== undefined &&
    Number.isInteger(preferredDorsal) &&
    preferredDorsal >= 1 &&
    preferredDorsal <= 99 &&
    !taken.has(preferredDorsal)
  ) {
    return preferredDorsal;
  }
  for (let d = 1; d <= 99; d++) {
    if (!taken.has(d)) return d;
  }
  return 99;
}

export function validatePlayerTransfer(
  player: Player | undefined,
  sourceTeam: Team | undefined,
  targetTeam: Team | undefined,
  targetTeamPlayers: Player[],
  rules: Pick<CompetitionRules, 'maxActivePlayers' | 'registrationOpen' | 'registrationDeadline'>,
  payload: {
    dorsal: number;
    nowIso?: string;
  }
): RosterValidationResult {
  if (!player) {
    return { ok: false, error: 'Jugador no encontrado.' };
  }
  if (player.status !== 'active') {
    return {
      ok: false,
      error: 'Solo se pueden transferir jugadores activos. Reactiva al jugador antes de transferirlo.',
    };
  }
  if (!sourceTeam || !targetTeam) {
    return { ok: false, error: 'Equipo de origen o destino no encontrado.' };
  }
  if (sourceTeam.id === targetTeam.id) {
    return { ok: false, error: 'Selecciona un club destino distinto al actual.' };
  }
  if (sourceTeam.competitionId !== targetTeam.competitionId) {
    return {
      ok: false,
      error: 'Solo se permiten transferencias entre clubes de la misma competencia.',
    };
  }

  return validateRosterMutation(targetTeamPlayers, 'add', rules, {
    name: player.name,
    dorsal: payload.dorsal,
    nowIso: payload.nowIso,
  });
}

export function computeMatchScoreFromEvents(
  match: Match,
  events: MatchEvent[]
): { homeScore: number; awayScore: number } {
  const matchGoals = events.filter((e) => e.matchId === match.id && e.type === 'goal');
  let homeScore = 0;
  let awayScore = 0;
  for (const goal of matchGoals) {
    if (goal.teamId === match.homeTeamId) homeScore += 1;
    else if (goal.teamId === match.awayTeamId) awayScore += 1;
  }
  return { homeScore, awayScore };
}

export function sanitizePublicEvents(events: MatchEvent[]): MatchEvent[] {
  return events.filter((e) => !(e.type === 'special_note' && e.visibility === 'internal'));
}

export function buildTickerNewsItems(
  matches: Match[],
  events: MatchEvent[],
  teams: Team[],
  players: Player[],
  publicTransfers: PublicTransferNotice[] = []
): TickerNewsItem[] {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const playerById = new Map(players.map((p) => [p.id, p]));
  const items: TickerNewsItem[] = [];

  for (const event of events) {
    if (event.type !== 'yellow_card' && event.type !== 'red_card') continue;
    const team = teamById.get(event.teamId);
    const player = event.playerId ? playerById.get(event.playerId) : undefined;
    const playerLabel = player ? `#${player.dorsal} ${player.name}` : 'Jugador';
    const teamLabel = team ? ` (${team.shortName})` : '';
    const minLabel = event.minute ? ` · Min ${event.minute}'` : '';

    items.push({
      id: `news-ev-${event.id}`,
      kind: event.type,
      label: event.type === 'red_card' ? 'Tarjeta roja' : 'Tarjeta amarilla',
      headline: `${playerLabel}${teamLabel}${minLabel}`,
      createdAt: event.createdAt,
      matchId: event.matchId,
      playerId: event.playerId,
    });
  }

  for (const transfer of publicTransfers) {
    items.push({
      id: `news-tr-${transfer.id}`,
      kind: 'transfer',
      label: 'Transferencia',
      headline: `${transfer.previousValue} → ${transfer.newValue}`,
      createdAt: transfer.createdAt,
      playerId: transfer.playerId,
    });
  }

  for (const match of matches) {
    if (match.status !== 'finalizado' && match.status !== 'en_juego') continue;
    const home = teamById.get(match.homeTeamId);
    const away = teamById.get(match.awayTeamId);
    if (!home || !away) continue;

    items.push({
      id: `news-m-${match.id}`,
      kind: 'match_result',
      label: match.status === 'en_juego' ? 'En vivo' : 'Resultado',
      headline: `${home.name} ${match.homeScore} - ${match.awayScore} ${away.name} (J${match.jornada})`,
      createdAt: match.kickoffAt,
      matchId: match.id,
    });
  }

  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 24);
}

export interface LiveMatchClock {
  formattedClock: string;
  minute: number;
  totalSeconds: number;
  isPaused: boolean;
}

export function computeLiveMatchClock(
  match: Pick<
    Match,
    'status' | 'liveStartedAt' | 'liveElapsedSeconds' | 'liveClockPaused' | 'liveMinute'
  >,
  nowMs: number = Date.now()
): LiveMatchClock | null {
  if (match.status !== 'en_juego') return null;
  const baseSeconds = Math.max(0, Math.floor(match.liveElapsedSeconds ?? 0));

  if (match.liveClockPaused) {
    const mins = Math.floor(baseSeconds / 60);
    const secs = baseSeconds % 60;
    return {
      formattedClock: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      minute: Math.max(1, mins + 1),
      totalSeconds: baseSeconds,
      isPaused: true,
    };
  }

  if (match.liveStartedAt) {
    const startMs = new Date(match.liveStartedAt).getTime();
    if (!Number.isNaN(startMs)) {
      const runningSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      const totalSeconds = baseSeconds + runningSeconds;
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return {
        formattedClock: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
        minute: Math.max(1, mins + 1),
        totalSeconds,
        isPaused: false,
      };
    }
  }

  if (baseSeconds > 0) {
    const mins = Math.floor(baseSeconds / 60);
    const secs = baseSeconds % 60;
    return {
      formattedClock: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      minute: Math.max(1, mins + 1),
      totalSeconds: baseSeconds,
      isPaused: false,
    };
  }

  const fallbackMin = Math.max(1, match.liveMinute ?? 1);
  return {
    formattedClock: `${String(fallbackMin - 1).padStart(2, '0')}:00`,
    minute: fallbackMin,
    totalSeconds: (fallbackMin - 1) * 60,
    isPaused: false,
  };
}

export function getManaguaDateKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Managua',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '0000';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function selectFeaturedMatchdayMatches(matches: Match[], maxCount = 2): Match[] {
  if (matches.length === 0 || maxCount <= 0) return [];

  const byKickoffAsc = (a: Match, b: Match) =>
    new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();

  const liveMatches = matches.filter((m) => m.status === 'en_juego').sort(byKickoffAsc);
  if (liveMatches.length > 0) {
    const targetDay = getManaguaDateKey(liveMatches[0].kickoffAt);
    const sameDayActive = matches
      .filter(
        (m) =>
          getManaguaDateKey(m.kickoffAt) === targetDay &&
          (m.status === 'en_juego' || m.status === 'programado')
      )
      .sort((a, b) => {
        if (a.status === 'en_juego' && b.status !== 'en_juego') return -1;
        if (a.status !== 'en_juego' && b.status === 'en_juego') return 1;
        return byKickoffAsc(a, b);
      });
    const selected = sameDayActive.slice(0, maxCount);
    if (selected.length < maxCount) {
      const selectedIds = new Set(selected.map((m) => m.id));
      const nextUpcoming = matches
        .filter((m) => m.status === 'programado' && !selectedIds.has(m.id))
        .sort(byKickoffAsc);
      for (const m of nextUpcoming) {
        if (selected.length >= maxCount) break;
        selected.push(m);
      }
    }
    return selected;
  }

  const scheduledMatches = matches.filter((m) => m.status === 'programado').sort(byKickoffAsc);
  if (scheduledMatches.length > 0) {
    const targetDay = getManaguaDateKey(scheduledMatches[0].kickoffAt);
    return scheduledMatches
      .filter((m) => getManaguaDateKey(m.kickoffAt) === targetDay)
      .slice(0, maxCount);
  }

  const finalizedMatches = matches
    .filter((m) => m.status === 'finalizado')
    .slice()
    .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime());

  if (finalizedMatches.length > 0) {
    const targetDay = getManaguaDateKey(finalizedMatches[0].kickoffAt);
    return finalizedMatches
      .filter((m) => getManaguaDateKey(m.kickoffAt) === targetDay)
      .sort(byKickoffAsc)
      .slice(0, maxCount);
  }

  return matches.slice().sort(byKickoffAsc).slice(0, maxCount);
}

export interface ParsedTransferSide {
  dorsal?: number;
  teamName?: string;
}

export function parseTransferTeamLabel(value: string): ParsedTransferSide {
  const dorsalMatch = value.match(/^#(\d+)\s+/);
  const teamMatch = value.match(/\(([^()]+)\)\s*$/);
  return {
    dorsal: dorsalMatch ? Number(dorsalMatch[1]) : undefined,
    teamName: teamMatch ? teamMatch[1].trim() : undefined,
  };
}

export interface PlayerClubStint {
  teamName: string;
  team?: Team;
  dorsal?: number;
  status: 'current' | 'previous';
  dateLabel?: string;
  toTeamName?: string;
  reason?: string;
}

export function buildPlayerClubHistory(
  player: Player,
  teams: Team[],
  publicTransfers: PublicTransferNotice[] = []
): PlayerClubStint[] {
  const teamByName = new Map(teams.map((t) => [t.name.toLowerCase(), t]));
  const currentTeam = teams.find((t) => t.id === player.teamId);

  const playerTransfers = publicTransfers
    .filter((tr) => tr.playerId === player.id)
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const lastTransfer = playerTransfers[playerTransfers.length - 1];
  const stints: PlayerClubStint[] = [
    {
      teamName: currentTeam?.name ?? 'Club actual',
      team: currentTeam,
      dorsal: player.dorsal,
      status: 'current',
      dateLabel: lastTransfer ? lastTransfer.createdAt : player.joinedAt,
    },
  ];

  // Add previous clubs from most recent transfer backwards
  for (let i = playerTransfers.length - 1; i >= 0; i--) {
    const tr = playerTransfers[i];
    const parsedPrev = parseTransferTeamLabel(tr.previousValue);
    const parsedNext = parseTransferTeamLabel(tr.newValue);
    const prevName = tr.fromTeamName ?? parsedPrev.teamName;
    const nextName = tr.toTeamName ?? parsedNext.teamName;
    if (!prevName) continue;

    stints.push({
      teamName: prevName,
      team: teamByName.get(prevName.toLowerCase()),
      dorsal: tr.fromDorsal ?? parsedPrev.dorsal,
      status: 'previous',
      dateLabel: tr.createdAt,
      toTeamName: nextName,
      reason: tr.reason,
    });
  }

  return stints;
}


