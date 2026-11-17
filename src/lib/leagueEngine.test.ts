import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildManaguaKickoffIso,
  buildPlayerClubHistory,
  buildTickerNewsItems,
  calculateDisciplineSummary,
  calculateStandings,
  calculateTopScorers,
  computeLiveMatchClock,
  findNextAvailableDorsal,
  getTeamStarters,
  MAX_STARTERS,
  parseTransferTeamLabel,
  sanitizePublicEvents,
  selectFeaturedMatchdayMatches,
  toManaguaDateTimeParts,
  validateMatchReschedule,
  validatePlayerTransfer,
  validateRosterMutation,
  validateTeamStarters,
} from './leagueEngine';
import { createSeedDatabase } from '../data/seedData';
import type {
  Match,
  MatchEvent,
  Player,
  PointAdjustment,
  PublicTransferNotice,
  Team,
} from '../types/league';

const teams: Team[] = [
  {
    id: 't1',
    competitionId: 'c1',
    name: 'Tiburones de San Juan',
    shortName: 'TIB',
    primaryColor: '#D4AF37',
    secondaryColor: '#0F172A',
    motif: 'shark',
    dtName: 'Carlos Mendoza',
    neighborhood: 'Centro',
  },
  {
    id: 't2',
    competitionId: 'c1',
    name: 'Atlético Nacascolo',
    shortName: 'NAC',
    primaryColor: '#0EA5E9',
    secondaryColor: '#0C4A6E',
    motif: 'wave',
    dtName: 'Roberto Sequeira',
    neighborhood: 'Nacascolo',
  },
  {
    id: 't3',
    competitionId: 'c1',
    name: 'Deportivo Marsella',
    shortName: 'MAR',
    primaryColor: '#10B981',
    secondaryColor: '#064E3B',
    motif: 'sun',
    dtName: 'Javier Morales',
    neighborhood: 'Marsella',
  },
];

const players: Player[] = [
  {
    id: 'p1',
    teamId: 't1',
    competitionId: 'c1',
    name: 'Mateo Rivera',
    dorsal: 9,
    primaryPosition: 'DEL',
    status: 'active',
    joinedAt: '2026-10-01',
  },
  {
    id: 'p2',
    teamId: 't2',
    competitionId: 'c1',
    name: 'Luis Vargas',
    dorsal: 10,
    primaryPosition: 'MED',
    status: 'archived',
    joinedAt: '2026-10-01',
    archivedAt: '2026-11-05',
  },
];

const matches: Match[] = [
  {
    id: 'm1',
    competitionId: 'c1',
    jornada: 1,
    homeTeamId: 't1',
    awayTeamId: 't2',
    kickoffAt: '2026-11-01T15:00:00Z',
    venue: 'Estadio Municipal',
    status: 'finalizado',
    homeScore: 3,
    awayScore: 1,
  },
  {
    id: 'm2',
    competitionId: 'c1',
    jornada: 2,
    homeTeamId: 't3',
    awayTeamId: 't1',
    kickoffAt: '2026-11-08T15:00:00Z',
    venue: 'Estadio Municipal',
    status: 'finalizado',
    homeScore: 2,
    awayScore: 2,
  },
  {
    id: 'm3',
    competitionId: 'c1',
    jornada: 3,
    homeTeamId: 't2',
    awayTeamId: 't3',
    kickoffAt: '2026-11-15T15:00:00Z',
    venue: 'Cancha Marsella',
    status: 'en_juego',
    homeScore: 1,
    awayScore: 0,
  },
];

test('calculateStandings computes points, goal difference, tie-breakers, and manual adjustments', () => {
  const adjustments: PointAdjustment[] = [
    {
      id: 'adj1',
      competitionId: 'c1',
      teamId: 't3',
      deltaPoints: 3,
      reason: 'Resolución administrativa por alineación indebida rival',
      createdAt: '2026-11-09T10:00:00Z',
      createdBy: 'Admin',
    },
  ];

  const table = calculateStandings(teams, matches, adjustments);

  // t1: 1W 1D = 4 pts, GF 5, GC 3, DIF +2
  // t3: 0W 1D = 1 base + 3 adj = 4 pts, GF 2, GC 2, DIF 0
  // t2: 0W 0D 1L = 0 pts (m3 is en_juego so not counted in official finalized table)
  assert.equal(table[0].teamId, 't1');
  assert.equal(table[0].pts, 4);
  assert.equal(table[0].dif, 2);

  assert.equal(table[1].teamId, 't3');
  assert.equal(table[1].pts, 4);
  assert.equal(table[1].adjustmentPts, 3);
  assert.equal(table[1].dif, 0);

  assert.equal(table[2].teamId, 't2');
  assert.equal(table[2].pj, 1);
  assert.equal(table[2].pts, 0);
});

test('calculateTopScorers preserves goals of archived players', () => {
  const events: MatchEvent[] = [
    {
      id: 'e1',
      competitionId: 'c1',
      matchId: 'm1',
      teamId: 't1',
      playerId: 'p1',
      type: 'goal',
      minute: 12,
      visibility: 'public',
      createdAt: '2026-11-01T15:12:00Z',
      createdBy: 'Admin',
    },
    {
      id: 'e2',
      competitionId: 'c1',
      matchId: 'm1',
      teamId: 't1',
      playerId: 'p1',
      type: 'goal',
      minute: 44,
      visibility: 'public',
      createdAt: '2026-11-01T15:44:00Z',
      createdBy: 'Admin',
    },
    {
      id: 'e3',
      competitionId: 'c1',
      matchId: 'm1',
      teamId: 't2',
      playerId: 'p2',
      type: 'goal',
      minute: 70,
      visibility: 'public',
      createdAt: '2026-11-01T16:10:00Z',
      createdBy: 'Admin',
    },
  ];

  const scorers = calculateTopScorers(players, teams, matches, events);
  assert.equal(scorers.length, 2);
  assert.equal(scorers[0].playerId, 'p1');
  assert.equal(scorers[0].goals, 2);
  assert.equal(scorers[1].playerId, 'p2');
  assert.equal(scorers[1].playerStatus, 'archived');
  assert.equal(scorers[1].goals, 1);
});

test('calculateDisciplineSummary tracks yellow accumulation and red suspensions and hides internal notes', () => {
  const events: MatchEvent[] = [
    {
      id: 'y1',
      competitionId: 'c1',
      matchId: 'm1',
      teamId: 't1',
      playerId: 'p1',
      type: 'yellow_card',
      minute: 15,
      visibility: 'public',
      createdAt: '2026-11-01T15:15:00Z',
      createdBy: 'Admin',
    },
    {
      id: 'y2',
      competitionId: 'c1',
      matchId: 'm2',
      teamId: 't1',
      playerId: 'p1',
      type: 'yellow_card',
      minute: 30,
      visibility: 'public',
      createdAt: '2026-11-08T15:30:00Z',
      createdBy: 'Admin',
    },
    {
      id: 'r1',
      competitionId: 'c1',
      matchId: 'm2',
      teamId: 't1',
      playerId: 'p1',
      type: 'red_card',
      minute: 88,
      visibility: 'public',
      createdAt: '2026-11-08T16:28:00Z',
      createdBy: 'Admin',
    },
    {
      id: 'n1',
      competitionId: 'c1',
      matchId: 'm2',
      teamId: 't1',
      playerId: 'p1',
      type: 'special_note',
      note: 'Nota privada de directiva',
      visibility: 'internal',
      createdAt: '2026-11-08T16:35:00Z',
      createdBy: 'Admin',
    },
  ];

  const publicOnly = calculateDisciplineSummary(
    players,
    teams,
    matches,
    events,
    { yellowAccumulationLimit: 3, redCardSuspensionMatches: 2 },
    [],
    false
  );

  assert.equal(publicOnly.length, 1);
  assert.equal(publicOnly[0].yellowCards, 2);
  assert.equal(publicOnly[0].yellowUntilSuspension, 1);
  assert.equal(publicOnly[0].redCards, 1);
  assert.equal(publicOnly[0].isSuspended, true);
  assert.equal(publicOnly[0].pendingMatches, 2);
  assert.equal(publicOnly[0].publicNotes.length, 0);

  const sanitized = sanitizePublicEvents(events);
  assert.equal(sanitized.some((e) => e.visibility === 'internal'), false);
});

test('validateRosterMutation enforces max 25 active players, dorsal uniqueness, and open registration', () => {
  const fullRoster: Player[] = Array.from({ length: 25 }, (_, i) => ({
    id: `fp-${i}`,
    teamId: 't1',
    competitionId: 'c1',
    name: `Jugador ${i + 1}`,
    dorsal: i + 1,
    primaryPosition: 'MED',
    status: 'active',
    joinedAt: '2026-10-01',
  }));

  const openRules = {
    maxActivePlayers: 25,
    registrationOpen: true,
    registrationDeadline: '2026-12-31',
  };

  const fullRes = validateRosterMutation(fullRoster, 'add', openRules, {
    name: 'Extra',
    dorsal: 99,
    nowIso: '2026-11-16',
  });
  assert.equal(fullRes.ok, false);
  assert.match(fullRes.error ?? '', /25/);

  const dorsalDupRes = validateRosterMutation(fullRoster.slice(0, 10), 'add', openRules, {
    name: 'Nuevo',
    dorsal: 5,
    nowIso: '2026-11-16',
  });
  assert.equal(dorsalDupRes.ok, false);
  assert.match(dorsalDupRes.error ?? '', /dorsal/i);

  const closedRes = validateRosterMutation(
    fullRoster.slice(0, 10),
    'add',
    { ...openRules, registrationOpen: false },
    { name: 'Nuevo', dorsal: 50, nowIso: '2026-11-16' }
  );
  assert.equal(closedRes.ok, false);
});

test('validatePlayerTransfer and findNextAvailableDorsal enforce target club rules and dorsal uniqueness', () => {
  const teamA: Team = {
    id: 'team-1',
    competitionId: 'c1',
    name: 'Equipo 1',
    shortName: 'E01',
    primaryColor: '#D4AF37',
    secondaryColor: '#000',
    motif: 'shark',
    dtName: 'DT 1',
    neighborhood: 'SJDS',
  };
  const teamB: Team = {
    id: 'team-2',
    competitionId: 'c1',
    name: 'Equipo 2',
    shortName: 'E02',
    primaryColor: '#0EA5E9',
    secondaryColor: '#000',
    motif: 'wave',
    dtName: 'DT 2',
    neighborhood: 'SJDS',
  };

  const movingPlayer: Player = {
    id: 'p1',
    teamId: 'team-1',
    competitionId: 'c1',
    name: 'Delantero E01',
    dorsal: 9,
    primaryPosition: 'DEL',
    status: 'active',
    joinedAt: '2026-11-16',
  };

  const targetPlayers: Player[] = [
    {
      id: 'p2-1',
      teamId: 'team-2',
      competitionId: 'c1',
      name: 'Portero E02',
      dorsal: 1,
      primaryPosition: 'POR',
      status: 'active',
      joinedAt: '2026-11-16',
    },
    {
      id: 'p2-9',
      teamId: 'team-2',
      competitionId: 'c1',
      name: 'Delantero E02',
      dorsal: 9,
      primaryPosition: 'DEL',
      status: 'active',
      joinedAt: '2026-11-16',
    },
  ];

  const rules = {
    maxActivePlayers: 25,
    registrationOpen: true,
    registrationDeadline: '2026-11-30',
  };

  assert.equal(findNextAvailableDorsal(targetPlayers, 9), 2);
  assert.equal(findNextAvailableDorsal(targetPlayers, 10), 10);

  // Same team rejected
  const sameTeam = validatePlayerTransfer(movingPlayer, teamA, teamA, [movingPlayer], rules, {
    dorsal: 10,
    nowIso: '2026-11-16',
  });
  assert.equal(sameTeam.ok, false);

  // Dorsal conflict on target rejected
  const dorsalConflict = validatePlayerTransfer(movingPlayer, teamA, teamB, targetPlayers, rules, {
    dorsal: 9,
    nowIso: '2026-11-16',
  });
  assert.equal(dorsalConflict.ok, false);

  // Valid transfer with free dorsal passes
  const valid = validatePlayerTransfer(movingPlayer, teamA, teamB, targetPlayers, rules, {
    dorsal: 2,
    nowIso: '2026-11-16',
  });
  assert.equal(valid.ok, true);
});

test('buildTickerNewsItems includes only yellow cards, red cards, transfers, and finalized/live match results', () => {
  const teams: Team[] = [
    {
      id: 't1',
      competitionId: 'c1',
      name: 'Equipo 1',
      shortName: 'E01',
      primaryColor: '#D4AF37',
      secondaryColor: '#000',
      motif: 'shark',
      dtName: 'DT 1',
      neighborhood: 'SJDS',
    },
    {
      id: 't2',
      competitionId: 'c1',
      name: 'Equipo 2',
      shortName: 'E02',
      primaryColor: '#0EA5E9',
      secondaryColor: '#000',
      motif: 'wave',
      dtName: 'DT 2',
      neighborhood: 'SJDS',
    },
  ];
  const players: Player[] = [
    {
      id: 'p1',
      teamId: 't1',
      competitionId: 'c1',
      name: 'Carlos',
      dorsal: 7,
      primaryPosition: 'MED',
      status: 'active',
      joinedAt: '2026-11-01',
    },
  ];
  const matches: Match[] = [
    {
      id: 'm1',
      competitionId: 'c1',
      jornada: 1,
      homeTeamId: 't1',
      awayTeamId: 't2',
      kickoffAt: '2026-12-01T15:30:00-06:00',
      venue: 'Estadio',
      status: 'finalizado',
      homeScore: 2,
      awayScore: 1,
    },
    {
      id: 'm2',
      competitionId: 'c1',
      jornada: 1,
      homeTeamId: 't1',
      awayTeamId: 't2',
      kickoffAt: '2026-12-02T15:30:00-06:00',
      venue: 'Estadio',
      status: 'programado',
      homeScore: 0,
      awayScore: 0,
    },
  ];
  const events: MatchEvent[] = [
    {
      id: 'e-goal',
      competitionId: 'c1',
      matchId: 'm1',
      teamId: 't1',
      playerId: 'p1',
      type: 'goal',
      minute: 12,
      visibility: 'public',
      createdAt: '2026-12-01T15:42:00-06:00',
      createdBy: 'Admin',
    },
    {
      id: 'e-yc',
      competitionId: 'c1',
      matchId: 'm1',
      teamId: 't1',
      playerId: 'p1',
      type: 'yellow_card',
      minute: 35,
      visibility: 'public',
      createdAt: '2026-12-01T16:05:00-06:00',
      createdBy: 'Admin',
    },
    {
      id: 'e-rc',
      competitionId: 'c1',
      matchId: 'm1',
      teamId: 't1',
      playerId: 'p1',
      type: 'red_card',
      minute: 78,
      visibility: 'public',
      createdAt: '2026-12-01T16:48:00-06:00',
      createdBy: 'Admin',
    },
    {
      id: 'e-note',
      competitionId: 'c1',
      matchId: 'm1',
      teamId: 't1',
      type: 'special_note',
      note: 'Observación',
      visibility: 'public',
      createdAt: '2026-12-01T17:00:00-06:00',
      createdBy: 'Admin',
    },
  ];
  const transfers: PublicTransferNotice[] = [
    {
      id: 'tr1',
      playerId: 'p1',
      previousValue: '#7 Carlos (Equipo 1)',
      newValue: '#10 Carlos (Equipo 2)',
      createdAt: '2026-12-02T10:00:00-06:00',
    },
  ];

  const news = buildTickerNewsItems(matches, events, teams, players, transfers);
  assert.equal(news.length, 4);
  assert.deepEqual(
    news.map((n) => n.kind),
    ['transfer', 'red_card', 'yellow_card', 'match_result']
  );
  assert.equal(news.some((n) => n.headline.includes('Observación')), false);
});

test('computeLiveMatchClock formats elapsed MM:SS, freezes when paused, and accumulates on resume', () => {
  const start = '2026-12-01T15:30:00.000Z';
  const startMs = new Date(start).getTime();

  const at75s = computeLiveMatchClock(
    { status: 'en_juego', liveStartedAt: start, liveMinute: 1 },
    startMs + 75_000
  );
  assert.deepEqual(at75s, {
    formattedClock: '01:15',
    minute: 2,
    totalSeconds: 75,
    isPaused: false,
  });

  const pausedAt75s = computeLiveMatchClock(
    { status: 'en_juego', liveElapsedSeconds: 75, liveClockPaused: true, liveMinute: 2 },
    startMs + 300_000
  );
  assert.deepEqual(pausedAt75s, {
    formattedClock: '01:15',
    minute: 2,
    totalSeconds: 75,
    isPaused: true,
  });

  const resumedPlus10s = computeLiveMatchClock(
    {
      status: 'en_juego',
      liveElapsedSeconds: 75,
      liveClockPaused: false,
      liveStartedAt: '2026-12-01T15:35:00.000Z',
      liveMinute: 2,
    },
    new Date('2026-12-01T15:35:10.000Z').getTime()
  );
  assert.deepEqual(resumedPlus10s, {
    formattedClock: '01:25',
    minute: 2,
    totalSeconds: 85,
    isPaused: false,
  });

  const nonLive = computeLiveMatchClock(
    { status: 'suspendido', liveStartedAt: start, liveMinute: 1 },
    startMs + 75_000
  );
  assert.equal(nonLive, null);
});

test('selectFeaturedMatchdayMatches groups up to 2 same-day matches (4 teams) for scheduled, live, and finalized states', () => {
  const dayMatches: Match[] = [
    {
      id: 'd1-m1',
      competitionId: 'c1',
      jornada: 1,
      homeTeamId: 't1',
      awayTeamId: 't2',
      kickoffAt: '2026-12-01T15:30:00-06:00',
      venue: 'Estadio Municipal SJDS',
      status: 'programado',
      homeScore: 0,
      awayScore: 0,
    },
    {
      id: 'd1-m2',
      competitionId: 'c1',
      jornada: 1,
      homeTeamId: 't3',
      awayTeamId: 't4',
      kickoffAt: '2026-12-01T17:30:00-06:00',
      venue: 'Estadio Municipal SJDS',
      status: 'programado',
      homeScore: 0,
      awayScore: 0,
    },
    {
      id: 'd1-m3',
      competitionId: 'c1',
      jornada: 1,
      homeTeamId: 't5',
      awayTeamId: 't6',
      kickoffAt: '2026-12-01T19:30:00-06:00',
      venue: 'Estadio Municipal SJDS',
      status: 'programado',
      homeScore: 0,
      awayScore: 0,
    },
    {
      id: 'd2-m1',
      competitionId: 'c1',
      jornada: 1,
      homeTeamId: 't7',
      awayTeamId: 't8',
      kickoffAt: '2026-12-02T15:30:00-06:00',
      venue: 'Cancha El Remanso',
      status: 'programado',
      homeScore: 0,
      awayScore: 0,
    },
  ];

  // Scheduled: picks first 2 matches on 2026-12-01
  const scheduledPair = selectFeaturedMatchdayMatches(dayMatches);
  assert.deepEqual(
    scheduledPair.map((m) => m.id),
    ['d1-m1', 'd1-m2']
  );

  // Live priority: if d1-m2 is live, places it first as primary and pairs with upcoming d1-m1
  const withLive = dayMatches.map((m) =>
    m.id === 'd1-m2' ? { ...m, status: 'en_juego' as const, liveMinute: 25 } : m
  );
  const livePair = selectFeaturedMatchdayMatches(withLive);
  assert.deepEqual(
    livePair.map((m) => m.id),
    ['d1-m2', 'd1-m1']
  );

  // Finalized fallback: picks latest played day (2026-12-02, 1 match)
  const allDone = dayMatches.map((m) => ({ ...m, status: 'finalizado' as const }));
  const finalized = selectFeaturedMatchdayMatches(allDone);
  assert.deepEqual(
    finalized.map((m) => m.id),
    ['d2-m1']
  );
});

test('calculateStandings places eliminated teams at the bottom regardless of points', () => {
  const withEliminated: Team[] = [
    { ...teams[0], eliminated: true },
    teams[1],
    teams[2],
  ];

  // Even though t1 won 3-1 and drew 2-2 (4 pts), being eliminated moves t1 to the bottom
  const table = calculateStandings(withEliminated, matches, []);
  assert.equal(table[table.length - 1].teamId, 't1');
  assert.equal(table[table.length - 1].eliminated, true);
  assert.equal(table[0].eliminated, false);
});

test('parseTransferTeamLabel and buildPlayerClubHistory extract current and prior club stints', () => {
  assert.deepEqual(parseTransferTeamLabel('#9 Mateo Rivera (Deportivo Marsella)'), {
    dorsal: 9,
    teamName: 'Deportivo Marsella',
  });

  const baseHistory = buildPlayerClubHistory(players[0], teams, []);
  assert.equal(baseHistory.length, 1);
  assert.equal(baseHistory[0].teamName, 'Tiburones de San Juan');
  assert.equal(baseHistory[0].status, 'current');

  const transfers: PublicTransferNotice[] = [
    {
      id: 'tr-1',
      playerId: 'p1',
      previousValue: '#11 Mateo Rivera (Deportivo Marsella)',
      newValue: '#9 Mateo Rivera (Tiburones de San Juan)',
      fromTeamName: 'Deportivo Marsella',
      toTeamName: 'Tiburones de San Juan',
      fromDorsal: 11,
      toDorsal: 9,
      reason: 'Fichaje de media jornada',
      createdAt: '2026-11-12T10:00:00Z',
    },
  ];

  const history = buildPlayerClubHistory(players[0], teams, transfers);
  assert.equal(history.length, 2);
  assert.equal(history[0].status, 'current');
  assert.equal(history[0].teamName, 'Tiburones de San Juan');
  assert.equal(history[0].dorsal, 9);
  assert.equal(history[1].status, 'previous');
  assert.equal(history[1].teamName, 'Deportivo Marsella');
  assert.equal(history[1].dorsal, 11);
  assert.equal(history[1].toTeamName, 'Tiburones de San Juan');
  assert.equal(history[1].reason, 'Fichaje de media jornada');
});

test('createSeedDatabase seeds Liga Demo mid-Jornada 2 with exaggerated stats, >=2 yellows per team, and 3-yellow suspensions', () => {
  const db = createSeedDatabase();
  const demoComp = db.competitions.find((c) => c.id === 'liga-demo');
  assert.ok(demoComp);
  assert.equal(demoComp.name, 'Liga Demo');
  assert.equal(db.competitions[0].id, 'liga-demo');

  const demoTeams = db.teams.filter((t) => t.competitionId === 'liga-demo');
  const demoPlayers = db.players.filter((p) => p.competitionId === 'liga-demo');
  const demoMatches = db.matches.filter((m) => m.competitionId === 'liga-demo');
  const demoEvents = db.events.filter((e) => e.competitionId === 'liga-demo');
  const demoAdjs = db.pointAdjustments.filter((a) => a.competitionId === 'liga-demo');

  assert.equal(demoTeams.length, 16);
  const eliminatedTeams = demoTeams.filter((t) => t.eliminated);
  assert.equal(eliminatedTeams.length, 4);

  for (const t of demoTeams) {
    const squad = demoPlayers.filter((p) => p.teamId === t.id);
    assert.ok(squad.length >= 16 && squad.length <= 20, `Team ${t.name} has ${squad.length} players`);
    const starters = getTeamStarters(t, squad);
    assert.equal(starters.length, MAX_STARTERS, `Team ${t.name} should have 11 default starters`);
  }

  // Every match goal event count matches its recorded home/away score
  for (const m of demoMatches) {
    const matchGoals = demoEvents.filter((e) => e.matchId === m.id && e.type === 'goal');
    const hGoals = matchGoals.filter((e) => e.teamId === m.homeTeamId).length;
    const aGoals = matchGoals.filter((e) => e.teamId === m.awayTeamId).length;
    assert.equal(hGoals, m.homeScore, `Home goals mismatch on ${m.id}`);
    assert.equal(aGoals, m.awayScore, `Away goals mismatch on ${m.id}`);
  }

  const j2Matches = demoMatches.filter((m) => m.jornada === 2);
  assert.equal(j2Matches.filter((m) => m.status === 'finalizado').length, 4);
  const liveMatches = j2Matches.filter((m) => m.status === 'en_juego');
  assert.equal(liveMatches.length, 1);
  assert.equal(liveMatches[0].homeScore, 3);
  assert.equal(liveMatches[0].awayScore, 1);
  assert.equal(liveMatches[0].liveClockPaused, true);
  assert.ok((liveMatches[0].liveMinute ?? 0) > 45);
  assert.equal(j2Matches.filter((m) => m.status === 'programado').length, 3);

  const standings = calculateStandings(demoTeams, demoMatches, demoAdjs);
  assert.ok(standings[0].pts >= 10, `Expected exaggerated top points, got ${standings[0].pts}`);
  assert.ok(standings[0].gf >= 15, `Expected exaggerated top GF, got ${standings[0].gf}`);
  assert.deepEqual(
    standings.slice(12).map((r) => r.eliminated),
    [true, true, true, true]
  );

  // At least 2 yellow cards per team & multiple players with 3 yellows who are suspended
  const discipline = calculateDisciplineSummary(
    demoPlayers,
    demoTeams,
    demoMatches,
    demoEvents,
    demoComp.rules
  );
  for (const t of demoTeams) {
    const teamYellows = discipline
      .filter((d) => d.teamId === t.id)
      .reduce((acc, d) => acc + d.yellowCards, 0);
    assert.ok(teamYellows >= 2, `Team ${t.name} has only ${teamYellows} yellow cards`);
  }

  const yellowSuspended = discipline.filter((d) => d.yellowCards >= 3 && d.isSuspended);
  assert.ok(
    yellowSuspended.length >= 4,
    `Expected at least 4 players suspended with 3 yellow cards, got ${yellowSuspended.length}`
  );
});

test('validateTeamStarters and getTeamStarters enforce 11-player limit, active status, team ownership, and lineup order', () => {
  const squad: Player[] = [
    { id: 'sp-9', teamId: 't1', competitionId: 'c1', name: 'Delantero 9', dorsal: 9, primaryPosition: 'DEL', status: 'active', joinedAt: '2026-11-01' },
    { id: 'sp-1', teamId: 't1', competitionId: 'c1', name: 'Portero 1', dorsal: 1, primaryPosition: 'POR', status: 'active', joinedAt: '2026-11-01' },
    { id: 'sp-4', teamId: 't1', competitionId: 'c1', name: 'Defensa 4', dorsal: 4, primaryPosition: 'DEF', status: 'active', joinedAt: '2026-11-01' },
    { id: 'sp-8', teamId: 't1', competitionId: 'c1', name: 'Medio 8', dorsal: 8, primaryPosition: 'MED', status: 'active', joinedAt: '2026-11-01' },
    ...Array.from({ length: 8 }, (_, idx) => ({
      id: `sp-extra-${idx + 2}`,
      teamId: 't1',
      competitionId: 'c1',
      name: `Jugador ${idx + 2}`,
      dorsal: 20 + idx,
      primaryPosition: 'MED' as const,
      status: 'active' as const,
      joinedAt: '2026-11-01',
    })),
    { id: 'sp-arch', teamId: 't1', competitionId: 'c1', name: 'Archivado', dorsal: 99, primaryPosition: 'DEL', status: 'archived', joinedAt: '2026-11-01', archivedAt: '2026-11-10' },
  ];

  // Exceeds 11
  const twelveIds = squad.filter((p) => p.status === 'active').map((p) => p.id);
  assert.equal(twelveIds.length, 12);
  const tooMany = validateTeamStarters(squad, twelveIds);
  assert.equal(tooMany.ok, false);
  assert.match(tooMany.error ?? '', /11/);

  // Duplicate
  const dup = validateTeamStarters(squad, ['sp-1', 'sp-1']);
  assert.equal(dup.ok, false);

  // Archived player rejected
  const arch = validateTeamStarters(squad, ['sp-1', 'sp-arch']);
  assert.equal(arch.ok, false);

  // Foreign player rejected
  const foreign = validateTeamStarters(squad, ['sp-1', 'other-team-player']);
  assert.equal(foreign.ok, false);

  // Valid 11 passes and getTeamStarters sorts POR -> DEF -> MED -> DEL
  const validIds = ['sp-9', 'sp-8', 'sp-4', 'sp-1', ...twelveIds.slice(4, 11)];
  assert.equal(validIds.length, 11);
  assert.equal(validateTeamStarters(squad, validIds).ok, true);

  const resolved = getTeamStarters({ id: 't1', starterPlayerIds: validIds }, squad);
  assert.equal(resolved.length, 11);
  assert.equal(resolved[0].primaryPosition, 'POR');
  assert.equal(resolved[1].primaryPosition, 'DEF');
  assert.equal(resolved[10].primaryPosition, 'DEL');
});

test('createSeedDatabase seeds Liga Héroes y Mártires with the 16 official clubs', () => {
  const db = createSeedDatabase();
  const hymTeams = db.teams.filter((t) => t.competitionId === 'liga-heroes-y-martires');
  assert.deepEqual(
    hymTeams.map((t) => t.name),
    [
      'Auxiliadora FC',
      'CEBADILLA FC',
      'CUESTA FC',
      'ENCANTO DEL SUR',
      'GALES FC',
      'HARYS FC',
      'HOOLLIGANS FC',
      'NEWCASTLE FC',
      'Novatos de la Virgen',
      'ORO FC',
      'OSTIONAL FC',
      'Oro Jr',
      'POCHOTE FC',
      'Real San Juan FC',
      'SUNDERLAND FC',
      'TORTUGA FC',
    ]
  );
  assert.equal(new Set(hymTeams.map((t) => t.shortName)).size, 16);
});

test('Managua date/time helpers and validateMatchReschedule handle timezone and status guards', () => {
  const parts = toManaguaDateTimeParts('2026-12-01T15:30:00-06:00');
  assert.deepEqual(parts, { date: '2026-12-01', time: '15:30' });

  const built = buildManaguaKickoffIso('2026-12-10', '18:45');
  assert.equal(built, '2026-12-10T18:45:00-06:00');
  assert.equal(buildManaguaKickoffIso('2026-02-30', '15:00'), null);
  assert.equal(buildManaguaKickoffIso('2026-12-10', '25:00'), null);

  assert.equal(
    validateMatchReschedule({ status: 'finalizado' }, { kickoffAt: built!, venue: 'Estadio SJDS' }).ok,
    false
  );
  assert.equal(
    validateMatchReschedule({ status: 'programado' }, { kickoffAt: built!, venue: ' ' }).ok,
    false
  );
  const valid = validateMatchReschedule(
    { status: 'programado' },
    { kickoffAt: built!, venue: '  Cancha El Remanso  ' }
  );
  assert.equal(valid.ok, true);
  assert.equal(valid.venue, 'Cancha El Remanso');
});




