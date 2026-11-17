import { ArrowLeft, ArrowLeftRight, ShieldAlert, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';
import { buildPlayerClubHistory, getPositionLabel } from '../lib/leagueEngine';
import type {
  CompetitionRules,
  DisciplinePlayerRow,
  MatchEvent,
  Player,
  PublicTransferNotice,
  PublicUser,
  StandingsRow,
  Team,
} from '../types/league';
import { TeamCrest } from './TeamCrest';
import { TransferPlayerModal } from './TransferPlayerModal';

interface TeamsViewProps {
  teams: Team[];
  players: Player[];
  events: MatchEvent[];
  standings: StandingsRow[];
  discipline: DisciplinePlayerRow[];
  publicTransfers?: PublicTransferNotice[];
  rules: CompetitionRules;
  competitionStatus: 'active' | 'archived';
  user: PublicUser | null;
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string | null) => void;
  onSelectPlayer: (playerId: string) => void;
  onOpenAuth: () => void;
  onRefresh: () => Promise<void>;
}

export function TeamsView({
  teams,
  players,
  events,
  standings,
  discipline,
  publicTransfers = [],
  rules,
  competitionStatus,
  user,
  selectedTeamId,
  onSelectTeam,
  onSelectPlayer,
  onOpenAuth,
  onRefresh,
}: TeamsViewProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferFeedback, setTransferFeedback] = useState<string | null>(null);

  const activeTeam = selectedTeamId ? teams.find((t) => t.id === selectedTeamId) : undefined;

  if (activeTeam) {
    const teamPlayers = players
      .filter((p) => p.teamId === activeTeam.id)
      .slice()
      .sort((a, b) => a.dorsal - b.dorsal);
    const activePlayers = teamPlayers.filter((p) => p.status === 'active');
    const archivedPlayers = teamPlayers.filter((p) => p.status === 'archived');
    const standing = standings.find((s) => s.teamId === activeTeam.id);
    const displayedPlayers = showArchived ? teamPlayers : activePlayers;
    const isTeamDt =
      user !== null &&
      user.role === 'dt' &&
      (user.assignedTeamId === activeTeam.id || activeTeam.dtUserId === user.id);

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            setShowArchived(false);
            onSelectTeam(null);
          }}
          className="min-h-[40px] inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-[#D4AF37] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a todos los clubes</span>
        </button>

        {/* Club Profile Header */}
        <section
          className={`rounded-lg border p-4 sm:p-6 ${
            activeTeam.eliminated
              ? 'border-rose-500/40 bg-rose-950/20'
              : 'border-white/[0.08] bg-[#111114]'
          }`}
        >
          <div className="flex flex-col gap-4 sm:gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <TeamCrest
                name={activeTeam.name}
                shortName={activeTeam.shortName}
                primaryColor={activeTeam.primaryColor}
                secondaryColor={activeTeam.secondaryColor}
                motif={activeTeam.motif}
                logoUrl={activeTeam.logoUrl}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-400">
                  {activeTeam.neighborhood} · Sigla {activeTeam.shortName}
                  {activeTeam.eliminated && (
                    <span className="ml-1.5 font-bold uppercase tracking-wider text-rose-400">
                      · Eliminado
                    </span>
                  )}
                </p>
                <h1
                  className={`font-display text-2xl sm:text-4xl font-bold tracking-wide leading-tight break-words ${
                    activeTeam.eliminated ? 'text-rose-200' : 'text-[#F5F5F4]'
                  }`}
                >
                  {activeTeam.name}
                </h1>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#D4AF37]">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>Director Técnico: {activeTeam.dtName}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-white/[0.08] rounded-lg border border-white/[0.08] bg-[#0D0D10] sm:min-w-[280px]">
              <div className="p-2.5 sm:p-3 text-center">
                <div className="font-mono-num text-lg sm:text-xl font-bold text-[#D4AF37]">
                  {standing?.position ?? '—'}°
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Posición</div>
              </div>
              <div className="p-2.5 sm:p-3 text-center">
                <div className="font-mono-num text-lg sm:text-xl font-bold text-[#F5F5F4]">
                  {standing?.pts ?? 0}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Puntos</div>
              </div>
              <div className="p-2.5 sm:p-3 text-center">
                <div className="font-mono-num text-lg sm:text-xl font-bold text-[#F5F5F4]">
                  {activePlayers.length}/{rules.maxActivePlayers}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Plantel</div>
              </div>
            </div>
          </div>
        </section>

        {/* Roster Section */}
        <section className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 sm:px-5 py-3.5 sm:py-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-[#F5F5F4]">
                Plantilla oficial
              </h2>
              <p className="text-xs text-zinc-400">
                Cupo máximo: {rules.maxActivePlayers} jugadores activos · Selecciona un jugador para
                ver sus goles y disciplina
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isTeamDt &&
                teams.length > 1 &&
                activePlayers.length > 0 &&
                competitionStatus !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTransferFeedback(null);
                      setTransferModalOpen(true);
                    }}
                    className="min-h-[38px] inline-flex items-center gap-1.5 rounded-md border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-3.5 py-1.5 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Transferir</span>
                  </button>
                )}

              {archivedPlayers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowArchived((v) => !v)}
                  className="min-h-[38px] rounded-md border border-white/[0.12] bg-[#0D0D10] px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors cursor-pointer"
                >
                  {showArchived
                    ? 'Ocultar bajas archivadas'
                    : `Ver historial con bajas (${archivedPlayers.length})`}
                </button>
              )}
            </div>
          </div>

          {transferFeedback && (
            <div
              role="status"
              className="border-b border-emerald-500/30 bg-emerald-950/30 px-5 py-3 text-xs text-emerald-200"
            >
              {transferFeedback}
            </div>
          )}

          {displayedPlayers.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-400">
              Este club aún no tiene jugadores inscritos en la competencia.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {displayedPlayers.map((player) => {
                const goals = events.filter(
                  (e) => e.playerId === player.id && e.type === 'goal'
                ).length;
                const disc = discipline.find((d) => d.playerId === player.id);
                const clubHistory = buildPlayerClubHistory(player, teams, publicTransfers);
                const previousClub = clubHistory.find((s) => s.status === 'previous');

                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => onSelectPlayer(player.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-white/[0.025] transition-colors cursor-pointer touch-manipulation"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-mono-num w-9 h-9 rounded-md border border-white/[0.12] bg-[#0D0D10] flex items-center justify-center text-sm font-bold text-[#D4AF37] shrink-0">
                        {player.dorsal}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-semibold text-sm text-[#F5F5F4] leading-snug">
                            {player.name}
                          </span>
                          {player.status === 'archived' && (
                            <span className="text-[11px] text-zinc-400">· Archivado</span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 leading-snug">
                          <span className="text-zinc-200 font-medium">
                            {getPositionLabel(player.primaryPosition)} ({player.primaryPosition})
                          </span>
                          {player.secondaryPosition && (
                            <span> · Sec: {player.secondaryPosition}</span>
                          )}
                          {previousClub && (
                            <span className="text-[#D4AF37]">
                              {' '}
                              · Ex {previousClub.teamName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-4 shrink-0 text-xs">
                      {goals > 0 && (
                        <span className="font-mono-num text-emerald-400 font-semibold whitespace-nowrap">
                          {goals} gol{goals > 1 ? 'es' : ''}
                        </span>
                      )}
                      {disc && (disc.yellowCards > 0 || disc.redCards > 0) && (
                        <span className="inline-flex items-center gap-2 font-mono-num">
                          {disc.yellowCards > 0 && (
                            <span className="inline-flex items-center gap-1 text-amber-400">
                              <span className="inline-block w-2 h-3 rounded-[1px] bg-amber-400" aria-hidden="true" />
                              {disc.yellowCards}
                            </span>
                          )}
                          {disc.redCards > 0 && (
                            <span className="inline-flex items-center gap-1 text-rose-400">
                              <span className="inline-block w-2 h-3 rounded-[1px] bg-rose-500" aria-hidden="true" />
                              {disc.redCards}
                            </span>
                          )}
                        </span>
                      )}
                      {disc?.isSuspended && (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold whitespace-nowrap">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Suspendido</span>
                          <span className="sm:hidden">Susp.</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {isTeamDt && (
          <TransferPlayerModal
            isOpen={transferModalOpen}
            sourceTeam={activeTeam}
            teams={teams}
            players={players}
            user={user}
            competitionStatus={competitionStatus}
            maxActivePlayers={rules.maxActivePlayers}
            onClose={() => setTransferModalOpen(false)}
            onOpenAuth={onOpenAuth}
            onSuccess={async (msg) => {
              setTransferFeedback(msg);
              await onRefresh();
            }}
          />
        )}
      </div>
    );
  }

  // Grid of all Teams
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-[#F5F5F4]">
          Equipos y Planteles
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Explora los clubes inscritos, su Director Técnico y la plantilla oficial de hasta{' '}
          {rules.maxActivePlayers} jugadores activos.
        </p>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-lg border border-white/[0.08] bg-[#111114] p-10 text-center text-sm text-zinc-400">
          No hay clubes registrados en esta competencia aún.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const activeCount = players.filter(
              (p) => p.teamId === team.id && p.status === 'active'
            ).length;
            const row = standings.find((s) => s.teamId === team.id);

            return (
              <button
                key={team.id}
                type="button"
                onClick={() => onSelectTeam(team.id)}
                className={`flex flex-col justify-between rounded-lg border p-4 sm:p-5 text-left transition-colors cursor-pointer touch-manipulation ${
                  team.eliminated
                    ? 'border-rose-500/40 bg-rose-950/20 hover:border-rose-400'
                    : 'border-white/[0.08] bg-[#111114] hover:border-[#D4AF37]/45 hover:bg-[#151519]'
                }`}
              >
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <TeamCrest
                    name={team.name}
                    shortName={team.shortName}
                    primaryColor={team.primaryColor}
                    secondaryColor={team.secondaryColor}
                    motif={team.motif}
                    logoUrl={team.logoUrl}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-400 leading-snug">
                      {team.neighborhood} · {row ? `${row.position}° lugar` : 'Club oficial'}
                      {team.eliminated && (
                        <span className="ml-1.5 font-bold uppercase tracking-wider text-rose-400">
                          · Eliminado
                        </span>
                      )}
                    </p>
                    <h2
                      className={`font-display text-xl sm:text-2xl font-bold tracking-wide leading-tight line-clamp-2 ${
                        team.eliminated ? 'text-rose-200' : 'text-[#F5F5F4]'
                      }`}
                    >
                      {team.name}
                    </h2>
                    <p className="mt-1 text-xs text-[#D4AF37]">DT: {team.dtName}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="font-mono-num text-zinc-200 font-semibold">
                      {activeCount}/{rules.maxActivePlayers}
                    </span>{' '}
                    activos
                  </span>
                  <span className="font-mono-num">
                    <strong className={team.eliminated ? 'text-rose-300' : 'text-[#F5F5F4]'}>
                      {row?.pts ?? 0}
                    </strong>{' '}
                    pts · {row?.pj ?? 0} PJ
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
