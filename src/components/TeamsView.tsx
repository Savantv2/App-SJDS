import {
  ArrowLeft,
  ArrowLeftRight,
  Plus,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { updateTeamStartersRequest } from '../lib/api';
import {
  buildPlayerClubHistory,
  getPositionLabel,
  getTeamStarters,
  MAX_STARTERS,
  sortPlayersByLineupOrder,
} from '../lib/leagueEngine';
import type {
  CompetitionRules,
  DisciplinePlayerRow,
  MatchEvent,
  Player,
  PositionCode,
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

const POSITION_ORDER_LIST: PositionCode[] = ['POR', 'DEF', 'MED', 'DEL'];

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
  const [startersViewTeamId, setStartersViewTeamId] = useState<string | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferFeedback, setTransferFeedback] = useState<string | null>(null);
  const [starterBusy, setStarterBusy] = useState(false);
  const [starterFeedback, setStarterFeedback] = useState<{
    type: 'ok' | 'error';
    text: string;
  } | null>(null);

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
    const canManageStarters =
      user !== null &&
      competitionStatus !== 'archived' &&
      (user.role === 'admin' || isTeamDt);

    const starters = getTeamStarters(activeTeam, teamPlayers);
    const starterIdSet = new Set(starters.map((p) => p.id));
    const benchPlayers = sortPlayersByLineupOrder(
      activePlayers.filter((p) => !starterIdSet.has(p.id))
    );
    const showStarters = startersViewTeamId === activeTeam.id;
    const emptySlotsCount = Math.max(0, MAX_STARTERS - starters.length);

    const saveStarters = async (nextIds: string[], successMessage: string) => {
      setStarterFeedback(null);
      setStarterBusy(true);
      try {
        await updateTeamStartersRequest(activeTeam.id, nextIds);
        setStarterFeedback({ type: 'ok', text: successMessage });
        await onRefresh();
      } catch (err) {
        setStarterFeedback({
          type: 'error',
          text: err instanceof Error ? err.message : 'No se pudo actualizar los titulares.',
        });
      } finally {
        setStarterBusy(false);
      }
    };

    const handleAddStarter = (player: Player) => {
      if (starters.length >= MAX_STARTERS || starterIdSet.has(player.id)) return;
      const nextIds = [...starters.map((s) => s.id), player.id];
      void saveStarters(
        nextIds,
        `${player.name} (#${player.dorsal}) agregado a los ${nextIds.length}/${MAX_STARTERS} titulares.`
      );
    };

    const handleRemoveStarter = (player: Player) => {
      const nextIds = starters.filter((s) => s.id !== player.id).map((s) => s.id);
      void saveStarters(
        nextIds,
        `${player.name} (#${player.dorsal}) retirado del once titular (${nextIds.length}/${MAX_STARTERS}).`
      );
    };

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            setShowArchived(false);
            setStartersViewTeamId(null);
            setStarterFeedback(null);
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

        {/* Roster & Starting 11 Section */}
        <section className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-white/[0.08] px-4 sm:px-5 py-3.5 sm:py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-[#F5F5F4]">
                  {showStarters ? 'Once Titular Oficial' : 'Plantilla oficial'}
                </h2>
                <p className="text-xs text-zinc-400">
                  {showStarters
                    ? `Alineación de ${starters.length}/${MAX_STARTERS} titulares · Toca un jugador para ver su ficha`
                    : `Cupo máximo: ${rules.maxActivePlayers} jugadores activos · Selecciona un jugador para ver sus goles y disciplina`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Segmented Switcher: Plantilla | Titulares */}
                <div
                  role="tablist"
                  aria-label="Vista de jugadores del club"
                  className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto rounded-md border border-white/[0.1] bg-[#0D0D10] p-0.5"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!showStarters}
                    onClick={() => {
                      setStartersViewTeamId(null);
                      setStarterFeedback(null);
                    }}
                    className={`min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-[5px] px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer touch-manipulation ${
                      !showStarters
                        ? 'bg-[#D4AF37] text-[#0A0A0A]'
                        : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>Plantilla ({activePlayers.length})</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={showStarters}
                    onClick={() => {
                      setStartersViewTeamId(activeTeam.id);
                      setStarterFeedback(null);
                    }}
                    className={`min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-[5px] px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer touch-manipulation ${
                      showStarters
                        ? 'bg-[#D4AF37] text-[#0A0A0A]'
                        : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Titulares ({starters.length}/{MAX_STARTERS})</span>
                  </button>
                </div>

                {!showStarters &&
                  isTeamDt &&
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

                {!showStarters && archivedPlayers.length > 0 && (
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
          </div>

          {transferFeedback && !showStarters && (
            <div
              role="status"
              className="border-b border-emerald-500/30 bg-emerald-950/30 px-4 sm:px-5 py-3 text-xs text-emerald-200"
            >
              {transferFeedback}
            </div>
          )}

          {starterFeedback && showStarters && (
            <div
              role={starterFeedback.type === 'error' ? 'alert' : 'status'}
              className={`border-b px-4 sm:px-5 py-3 text-xs ${
                starterFeedback.type === 'error'
                  ? 'border-rose-500/30 bg-rose-950/30 text-rose-200'
                  : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200'
              }`}
            >
              {starterFeedback.text}
            </div>
          )}

          {showStarters ? (
            <div>
              {/* Tactical Lineup Summary (POR / DEF / MED / DEL) */}
              <div className="grid grid-cols-4 divide-x divide-white/[0.08] border-b border-white/[0.08] bg-[#0D0D10]">
                {POSITION_ORDER_LIST.map((pos) => {
                  const count = starters.filter((p) => p.primaryPosition === pos).length;
                  return (
                    <div key={pos} className="px-2 py-2.5 sm:py-3 text-center">
                      <div className="font-mono-num text-base sm:text-lg font-bold text-[#D4AF37]">
                        {count}
                      </div>
                      <div className="text-[11px] font-medium text-zinc-400">
                        {pos}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Starting 11 List */}
              {starters.length === 0 && !canManageStarters ? (
                <div className="p-8 text-center text-sm text-zinc-400">
                  El Director Técnico aún no ha confirmado los 11 titulares de este club.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.07]">
                  {starters.map((player, idx) => {
                    const goals = events.filter(
                      (e) => e.playerId === player.id && e.type === 'goal'
                    ).length;
                    const disc = discipline.find((d) => d.playerId === player.id);

                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between gap-2.5 sm:gap-3 px-4 sm:px-5 py-3 hover:bg-white/[0.02] transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => onSelectPlayer(player.id)}
                          className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 text-left cursor-pointer touch-manipulation"
                        >
                          <span className="font-mono-num text-xs font-semibold text-zinc-500 w-5 shrink-0">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="font-mono-num w-9 h-9 rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 flex items-center justify-center text-sm font-bold text-[#D4AF37] shrink-0">
                            {player.dorsal}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="font-semibold text-sm text-[#F5F5F4] leading-snug">
                                {player.name}
                              </span>
                              {disc?.isSuspended && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>Suspendido</span>
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 mt-0.5 leading-snug">
                              <span className="text-zinc-200 font-medium">
                                {getPositionLabel(player.primaryPosition)} ({player.primaryPosition})
                              </span>
                              {goals > 0 && (
                                <span className="font-mono-num text-emerald-400 font-semibold">
                                  {' '}
                                  · {goals} gol{goals > 1 ? 'es' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>

                        {canManageStarters && (
                          <button
                            type="button"
                            disabled={starterBusy}
                            onClick={() => handleRemoveStarter(player)}
                            aria-label={`Quitar a ${player.name} de titulares`}
                            className="min-h-[36px] inline-flex items-center gap-1 rounded-md border border-rose-500/35 bg-rose-950/20 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-950/45 disabled:opacity-50 transition-colors shrink-0 cursor-pointer touch-manipulation"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Quitar</span>
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {emptySlotsCount > 0 &&
                    Array.from({ length: emptySlotsCount }, (_, idx) => {
                      const slotNumber = starters.length + idx + 1;
                      return (
                        <div
                          key={`empty-slot-${slotNumber}`}
                          className="flex items-center gap-3 px-4 sm:px-5 py-3 text-xs text-zinc-500 bg-[#0D0D10]/40"
                        >
                          <span className="font-mono-num font-semibold w-5 shrink-0">
                            {String(slotNumber).padStart(2, '0')}
                          </span>
                          <span className="w-9 h-9 rounded-md border border-dashed border-white/[0.12] flex items-center justify-center font-mono-num text-zinc-600 shrink-0">
                            —
                          </span>
                          <span>
                            Cupo titular #{slotNumber} disponible
                            {canManageStarters ? ' · Selecciona un jugador del plantel abajo' : ''}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* DT / Admin Squad Picker to add to Starting 11 */}
              {canManageStarters && (
                <div className="border-t border-white/[0.1] bg-[#0D0D10] p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-bold tracking-wide text-[#F5F5F4]">
                        Añadir titulares desde el plantel ({benchPlayers.length} disponibles)
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {starters.length >= MAX_STARTERS
                          ? 'Ya completaste los 11 titulares. Quita un jugador arriba para ingresar otro.'
                          : `Puedes añadir hasta ${MAX_STARTERS - starters.length} jugador(es) más al once titular.`}
                      </p>
                    </div>
                  </div>

                  {benchPlayers.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      No hay más jugadores activos disponibles en el plantel.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {benchPlayers.map((player) => {
                        const disc = discipline.find((d) => d.playerId === player.id);
                        return (
                          <div
                            key={player.id}
                            className="flex items-center justify-between gap-2.5 rounded-md border border-white/[0.08] bg-[#111114] px-3 py-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono-num w-8 h-8 rounded border border-white/[0.12] bg-[#0D0D10] flex items-center justify-center text-xs font-bold text-[#D4AF37] shrink-0">
                                {player.dorsal}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-[#F5F5F4] truncate">
                                  {player.name}
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  {player.primaryPosition} · {getPositionLabel(player.primaryPosition)}
                                  {disc?.isSuspended && (
                                    <span className="text-rose-400 font-semibold"> · Susp.</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={starterBusy || starters.length >= MAX_STARTERS}
                              onClick={() => handleAddStarter(player)}
                              aria-label={`Añadir a titulares a ${player.name}`}
                              className="min-h-[36px] inline-flex items-center gap-1 rounded-md border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-2.5 py-1.5 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A] disabled:opacity-40 disabled:hover:bg-[#D4AF37]/10 disabled:hover:text-[#D4AF37] transition-colors shrink-0 cursor-pointer touch-manipulation"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Titular</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : displayedPlayers.length === 0 ? (
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
                const isStarter = starterIdSet.has(player.id);

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
                          {isStarter && (
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                              · Titular
                            </span>
                          )}
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
          Explora los clubes inscritos, sus 11 titulares y la plantilla oficial de hasta{' '}
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
            const teamPlayersList = players.filter((p) => p.teamId === team.id);
            const activeCount = teamPlayersList.filter((p) => p.status === 'active').length;
            const starterCount = getTeamStarters(team, teamPlayersList).length;
            const row = standings.find((s) => s.teamId === team.id);

            return (
              <div
                key={team.id}
                className={`flex flex-col justify-between rounded-lg border p-4 sm:p-5 transition-colors ${
                  team.eliminated
                    ? 'border-rose-500/40 bg-rose-950/20 hover:border-rose-400'
                    : 'border-white/[0.08] bg-[#111114] hover:border-[#D4AF37]/45 hover:bg-[#151519]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStartersViewTeamId(null);
                    onSelectTeam(team.id);
                  }}
                  className="flex items-start gap-3.5 sm:gap-4 text-left w-full cursor-pointer touch-manipulation"
                >
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
                </button>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3 text-xs text-zinc-400">
                  <div className="flex items-center gap-3">
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
                      pts
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStartersViewTeamId(team.id);
                      onSelectTeam(team.id);
                    }}
                    aria-label={`Ver titulares de ${team.name}`}
                    className="min-h-[32px] inline-flex items-center gap-1.5 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1 text-[11px] font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-colors cursor-pointer touch-manipulation"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Titulares ({starterCount}/11)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
