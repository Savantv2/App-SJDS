import type {
  Competition,
  EventType,
  MatchStatus,
  PositionCode,
  PublicOverviewPayload,
  PublicUser,
} from '../types/league';

const TOKEN_KEY = 'sjds_auth_token';
const COMP_KEY = 'sjds_selected_competition';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage failures
  }
}

export function getStoredCompetitionId(): string | null {
  try {
    return localStorage.getItem(COMP_KEY);
  } catch {
    return null;
  }
}

export function setStoredCompetitionId(compId: string): void {
  try {
    localStorage.setItem(COMP_KEY, compId);
  } catch {
    // ignore storage failures
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error de servidor (${res.status})`);
  }
  return data as T;
}

export async function fetchOverview(competitionId?: string): Promise<PublicOverviewPayload> {
  const query = competitionId ? `?competitionId=${encodeURIComponent(competitionId)}` : '';
  return apiFetch<PublicOverviewPayload>(`/api/public/overview${query}`);
}

export async function loginRequest(
  email: string,
  password: string
): Promise<{ token: string; user: PublicUser }> {
  return apiFetch<{ token: string; user: PublicUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMe(): Promise<{ user: PublicUser }> {
  return apiFetch<{ user: PublicUser }>('/api/auth/me');
}

export async function addPlayerRequest(
  teamId: string,
  payload: {
    name: string;
    dorsal: number;
    primaryPosition: PositionCode;
    secondaryPosition?: PositionCode;
  }
) {
  return apiFetch(`/api/teams/${encodeURIComponent(teamId)}/players`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePlayerRequest(
  teamId: string,
  playerId: string,
  payload: {
    dorsal?: number;
    primaryPosition?: PositionCode;
    secondaryPosition?: PositionCode | '';
    status?: 'active' | 'archived';
    name?: string;
  }
) {
  return apiFetch(
    `/api/teams/${encodeURIComponent(teamId)}/players/${encodeURIComponent(playerId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
}

export async function transferPlayerRequest(
  sourceTeamId: string,
  playerId: string,
  payload: {
    targetTeamId: string;
    dorsal: number;
    reason?: string;
  }
) {
  return apiFetch(
    `/api/teams/${encodeURIComponent(sourceTeamId)}/players/${encodeURIComponent(playerId)}/transfer`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export async function updateTeamLogoRequest(teamId: string, logoUrl: string | null) {
  return apiFetch(`/api/teams/${encodeURIComponent(teamId)}/logo`, {
    method: 'PATCH',
    body: JSON.stringify({ logoUrl }),
  });
}

export async function createCompetitionRequest(payload: {
  name: string;
  season: string;
  category: string;
  yellowAccumulationLimit: number;
  redCardSuspensionMatches: number;
  registrationDeadline: string;
}) {
  return apiFetch<{ competition: Competition }>('/api/admin/competitions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCompetitionRequest(
  competitionId: string,
  payload: {
    status?: 'active' | 'archived';
    championTeamName?: string;
    rules?: Partial<Competition['rules']>;
  }
) {
  return apiFetch(`/api/admin/competitions/${encodeURIComponent(competitionId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function createTeamRequest(payload: {
  competitionId: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  dtName: string;
  neighborhood: string;
}) {
  return apiFetch('/api/admin/teams', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createMatchRequest(payload: {
  competitionId: string;
  jornada: number;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string;
  venue: string;
  referee?: string;
}) {
  return apiFetch('/api/admin/matches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMatchRequest(
  matchId: string,
  payload: {
    status?: MatchStatus;
    homeScore?: number;
    awayScore?: number;
    liveMinute?: number;
    clockAction?: 'pause' | 'resume';
    reason?: string;
  }
) {
  return apiFetch(`/api/admin/matches/${encodeURIComponent(matchId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function addMatchEventRequest(
  matchId: string,
  payload: {
    teamId: string;
    playerId?: string;
    type: EventType;
    minute?: number;
    note?: string;
    visibility?: 'public' | 'internal';
  }
) {
  return apiFetch(`/api/admin/matches/${encodeURIComponent(matchId)}/events`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteMatchEventRequest(eventId: string, reason?: string) {
  return apiFetch(`/api/admin/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
}

export async function createPointAdjustmentRequest(payload: {
  competitionId: string;
  teamId: string;
  deltaPoints: number;
  reason: string;
}) {
  return apiFetch('/api/admin/point-adjustments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function overrideDisciplineRequest(payload: {
  competitionId: string;
  playerId: string;
  matchesRemaining: number;
  validated: boolean;
  note: string;
}) {
  return apiFetch('/api/admin/discipline/override', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resetDemoDataRequest() {
  return apiFetch('/api/admin/reset-demo', {
    method: 'POST',
  });
}
