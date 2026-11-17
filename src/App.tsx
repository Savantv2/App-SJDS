import { useCallback, useEffect, useState } from 'react';
import { AdminPanelView } from './components/AdminPanelView';
import { AuthModal } from './components/AuthModal';
import { CompetitionBar } from './components/CompetitionBar';
import { DisciplineView } from './components/DisciplineView';
import { DTPanelView } from './components/DTPanelView';
import { HomeView } from './components/HomeView';
import { MatchDetailModal } from './components/MatchDetailModal';
import { MatchesView } from './components/MatchesView';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { TablesView } from './components/TablesView';
import { TeamsView } from './components/TeamsView';
import { TopBar, type AppSection } from './components/TopBar';
import {
  fetchMe,
  fetchOverview,
  getStoredCompetitionId,
  getStoredToken,
  setStoredCompetitionId,
  setStoredToken,
} from './lib/api';
import type { PublicOverviewPayload, PublicUser } from './types/league';

export default function App() {
  const [section, setSection] = useState<AppSection>('inicio');
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | undefined>(
    () => getStoredCompetitionId() ?? undefined
  );
  const [overview, setOverview] = useState<PublicOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<PublicUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const loadOverview = useCallback(
    async (compId?: string) => {
      const targetId = compId ?? selectedCompetitionId;
      try {
        setError(null);
        const payload = await fetchOverview(targetId);
        setOverview(payload);
        if (payload.activeCompetition?.id) {
          setSelectedCompetitionId(payload.activeCompetition.id);
          setStoredCompetitionId(payload.activeCompetition.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la información de la liga.');
      } finally {
        setLoading(false);
      }
    },
    [selectedCompetitionId]
  );

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      fetchMe()
        .then(({ user: authed }) => setUser(authed))
        .catch(() => setStoredToken(null))
        .finally(() => void loadOverview());
    } else {
      void loadOverview();
    }
  }, [loadOverview]);

  const handleSelectCompetition = (compId: string) => {
    setSelectedCompetitionId(compId);
    setStoredCompetitionId(compId);
    setSelectedTeamId(null);
    setSelectedMatchId(null);
    setSelectedPlayerId(null);
    void loadOverview(compId);
  };

  const handleNavigate = (next: AppSection) => {
    setSelectedTeamId(null);
    setSection(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    setSection('equipos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = async (authedUser: PublicUser) => {
    setUser(authedUser);
    setSelectedTeamId(null);
    setSection(authedUser.role === 'admin' ? 'admin-panel' : 'dt-panel');
    await loadOverview(selectedCompetitionId);
  };

  const handleLogout = async () => {
    setStoredToken(null);
    setUser(null);
    if (section === 'dt-panel' || section === 'admin-panel') {
      setSection('inicio');
    }
    await loadOverview(selectedCompetitionId);
  };

  const selectedMatch =
    overview && selectedMatchId
      ? overview.matches.find((m) => m.id === selectedMatchId) ?? null
      : null;

  const selectedPlayer =
    overview && selectedPlayerId
      ? overview.players.find((p) => p.id === selectedPlayerId) ?? null
      : null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F4] flex flex-col pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
      <TopBar
        activeSection={section}
        onNavigate={handleNavigate}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {overview && (
        <CompetitionBar
          competitions={overview.competitions}
          activeCompetition={overview.activeCompetition}
          onSelectCompetition={handleSelectCompetition}
          user={user}
          onLogout={() => void handleLogout()}
          onOpenAuth={() => setAuthModalOpen(true)}
        />
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
        {loading && !overview ? (
          <div className="space-y-6" aria-busy="true">
            <div className="h-72 rounded-lg border border-white/[0.08] bg-[#111114] animate-pulse" />
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-64 rounded-lg border border-white/[0.08] bg-[#111114] animate-pulse" />
              <div className="h-64 rounded-lg border border-white/[0.08] bg-[#111114] animate-pulse" />
            </div>
          </div>
        ) : error && !overview ? (
          <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-8 text-center space-y-4">
            <p className="text-sm text-rose-200">{error}</p>
            <button
              type="button"
              onClick={() => void loadOverview(selectedCompetitionId)}
              className="min-h-[42px] rounded-md bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0A0A0A] cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : overview ? (
          <>
            {section === 'inicio' && (
              <HomeView
                data={overview}
                onNavigate={handleNavigate}
                onSelectMatch={(id) => setSelectedMatchId(id)}
                onSelectTeam={handleOpenTeam}
                onSelectPlayer={(id) => setSelectedPlayerId(id)}
              />
            )}

            {section === 'partidos' && (
              <MatchesView
                matches={overview.matches}
                teams={overview.teams}
                onSelectMatch={(id) => setSelectedMatchId(id)}
              />
            )}

            {section === 'equipos' && (
              <TeamsView
                teams={overview.teams}
                players={overview.players}
                events={overview.events}
                standings={overview.standings}
                discipline={overview.discipline}
                publicTransfers={overview.publicTransfers}
                rules={overview.activeCompetition.rules}
                competitionStatus={overview.activeCompetition.status}
                user={user}
                selectedTeamId={selectedTeamId}
                onSelectTeam={(id) => setSelectedTeamId(id)}
                onSelectPlayer={(id) => setSelectedPlayerId(id)}
                onOpenAuth={() => setAuthModalOpen(true)}
                onRefresh={() => loadOverview(overview.activeCompetition.id)}
              />
            )}

            {section === 'tablas' && (
              <TablesView
                standings={overview.standings}
                scorers={overview.scorers}
                pointAdjustments={overview.pointAdjustments}
                rules={overview.activeCompetition.rules}
                onSelectTeam={handleOpenTeam}
                onSelectPlayer={(id) => setSelectedPlayerId(id)}
              />
            )}

            {section === 'disciplina' && (
              <DisciplineView
                discipline={overview.discipline}
                teams={overview.teams}
                rules={overview.activeCompetition.rules}
                onSelectPlayer={(id) => setSelectedPlayerId(id)}
              />
            )}

            {section === 'dt-panel' && user && (
              <DTPanelView
                user={user}
                competition={overview.activeCompetition}
                teams={overview.teams}
                players={overview.players}
                onOpenAuth={() => setAuthModalOpen(true)}
                onRefresh={() => loadOverview(overview.activeCompetition.id)}
              />
            )}

            {section === 'admin-panel' && user?.role === 'admin' && (
              <AdminPanelView
                data={overview}
                onRefresh={(nextId) => loadOverview(nextId ?? overview.activeCompetition.id)}
              />
            )}
          </>
        ) : null}
      </main>

      <footer className="border-t border-white/10 bg-[#0A0A0A] py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <p>
            Liga San Juan del Sur · Fútbol Campo Oficial · San Juan del Sur, Nicaragua
          </p>
          <p>
            Información pública verificada por Comité Directivo
          </p>
        </div>
      </footer>

      <MatchDetailModal
        match={selectedMatch}
        teams={overview?.teams ?? []}
        players={overview?.players ?? []}
        events={overview?.events ?? []}
        onClose={() => setSelectedMatchId(null)}
        onSelectTeam={handleOpenTeam}
        onSelectPlayer={(id) => setSelectedPlayerId(id)}
      />

      <PlayerProfileModal
        player={selectedPlayer}
        teams={overview?.teams ?? []}
        matches={overview?.matches ?? []}
        events={overview?.events ?? []}
        disciplineRows={overview?.discipline ?? []}
        publicTransfers={overview?.publicTransfers ?? []}
        onClose={() => setSelectedPlayerId(null)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(u) => void handleAuthSuccess(u)}
      />
    </div>
  );
}
