export type UserRole = 'public' | 'dt' | 'admin';

export type PositionCode = 'POR' | 'DEF' | 'MED' | 'DEL';

export type MatchStatus = 'programado' | 'en_juego' | 'finalizado' | 'suspendido';

export type EventType = 'goal' | 'yellow_card' | 'red_card' | 'special_note';

export type CompetitionStatus = 'active' | 'archived';

export type CrestMotif = 'shark' | 'wave' | 'sun' | 'crown' | 'flame' | 'star';

export interface CompetitionRules {
  maxActivePlayers: number;
  yellowAccumulationLimit: number;
  redCardSuspensionMatches: number;
  registrationOpen: boolean;
  registrationDeadline: string; // YYYY-MM-DD
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
}

export interface Competition {
  id: string;
  name: string;
  season: string;
  category: string;
  status: CompetitionStatus;
  rules: CompetitionRules;
  championTeamName?: string;
}

export interface Team {
  id: string;
  competitionId: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  motif: CrestMotif;
  logoUrl?: string;
  dtName: string;
  dtUserId?: string;
  neighborhood: string;
  eliminated?: boolean;
  starterPlayerIds?: string[];
}

export interface Player {
  id: string;
  teamId: string;
  competitionId: string;
  name: string;
  dorsal: number;
  primaryPosition: PositionCode;
  secondaryPosition?: PositionCode;
  status: 'active' | 'archived';
  joinedAt: string;
  archivedAt?: string;
}

export interface Match {
  id: string;
  competitionId: string;
  jornada: number;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string; // ISO string
  venue: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  liveMinute?: number;
  liveStartedAt?: string;
  liveElapsedSeconds?: number;
  liveClockPaused?: boolean;
  referee?: string;
}

export interface MatchEvent {
  id: string;
  competitionId: string;
  matchId: string;
  teamId: string;
  playerId?: string;
  type: EventType;
  minute?: number;
  note?: string;
  visibility: 'public' | 'internal';
  createdAt: string;
  createdBy: string;
}

export interface PointAdjustment {
  id: string;
  competitionId: string;
  teamId: string;
  deltaPoints: number;
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface SuspensionOverride {
  id: string;
  competitionId: string;
  playerId: string;
  matchesRemaining: number;
  validated: boolean;
  note: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditLogEntry {
  id: string;
  competitionId: string;
  action: string;
  entityType: 'match' | 'event' | 'standings' | 'team' | 'player' | 'competition' | 'discipline';
  entityId: string;
  previousValue: string;
  newValue: string;
  reason: string;
  actorName: string;
  actorRole: UserRole;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Exclude<UserRole, 'public'>;
  assignedTeamId?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Exclude<UserRole, 'public'>;
  assignedTeamId?: string;
}

export interface StandingsRow {
  position: number;
  teamId: string;
  teamName: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  motif: CrestMotif;
  logoUrl?: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
  basePts: number;
  adjustmentPts: number;
  pts: number;
  adjustmentReasons: string[];
  form: Array<'G' | 'E' | 'P'>;
  eliminated?: boolean;
}

export interface ScorerRow {
  position: number;
  playerId: string;
  playerName: string;
  playerStatus: 'active' | 'archived';
  dorsal: number;
  primaryPosition: PositionCode;
  teamId: string;
  teamName: string;
  teamShortName: string;
  teamPrimaryColor: string;
  teamSecondaryColor: string;
  teamMotif: CrestMotif;
  teamLogoUrl?: string;
  goals: number;
  matchesPlayed: number;
}

export interface DisciplinePlayerRow {
  playerId: string;
  playerName: string;
  playerStatus: 'active' | 'archived';
  dorsal: number;
  teamId: string;
  teamName: string;
  teamShortName: string;
  teamPrimaryColor: string;
  yellowCards: number;
  yellowCycleCount: number;
  yellowUntilSuspension: number;
  redCards: number;
  isSuspended: boolean;
  suspensionReason?: string;
  pendingMatches: number;
  validatedByAdmin: boolean;
  publicNotes: Array<{
    id: string;
    matchId: string;
    minute?: number;
    note: string;
    createdAt: string;
  }>;
}

export interface PublicTransferNotice {
  id: string;
  playerId: string;
  previousValue: string;
  newValue: string;
  fromTeamName?: string;
  toTeamName?: string;
  fromDorsal?: number;
  toDorsal?: number;
  reason?: string;
  createdAt: string;
}

export type TickerNewsKind = 'yellow_card' | 'red_card' | 'transfer' | 'match_result';

export interface TickerNewsItem {
  id: string;
  kind: TickerNewsKind;
  label: string;
  headline: string;
  createdAt: string;
  matchId?: string;
  playerId?: string;
}

export interface PublicOverviewPayload {
  isDemoData: boolean;
  competitions: Competition[];
  activeCompetition: Competition;
  teams: Team[];
  players: Player[];
  matches: Match[];
  events: MatchEvent[];
  standings: StandingsRow[];
  scorers: ScorerRow[];
  discipline: DisciplinePlayerRow[];
  pointAdjustments: PointAdjustment[];
  publicTransfers?: PublicTransferNotice[];
  auditLogs?: AuditLogEntry[];
}
