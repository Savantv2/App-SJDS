import { AlertTriangle, ArrowRightLeft, Award, X } from 'lucide-react';
import { formatMatchDate } from '../lib/format';
import { buildPlayerClubHistory, getPositionLabel } from '../lib/leagueEngine';
import type {
  DisciplinePlayerRow,
  Match,
  MatchEvent,
  Player,
  PublicTransferNotice,
  Team,
} from '../types/league';
import { TeamCrest } from './TeamCrest';

interface PlayerProfileModalProps {
  player: Player | null;
  teams: Team[];
  matches: Match[];
  events: MatchEvent[];
  disciplineRows: DisciplinePlayerRow[];
  publicTransfers?: PublicTransferNotice[];
  onClose: () => void;
}

export function PlayerProfileModal({
  player,
  teams,
  matches,
  events,
  disciplineRows,
  publicTransfers = [],
  onClose,
}: PlayerProfileModalProps) {
  if (!player) return null;

  const team = teams.find((t) => t.id === player.teamId);
  const disc = disciplineRows.find((d) => d.playerId === player.id);
  const clubHistory = buildPlayerClubHistory(player, teams, publicTransfers);
  const hasTransfers = clubHistory.length > 1;
  const playerEvents = events
    .filter((e) => e.playerId === player.id)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const goalsCount = playerEvents.filter((e) => e.type === 'goal').length;
  const yellowsCount = playerEvents.filter((e) => e.type === 'yellow_card').length;
  const redsCount = playerEvents.filter((e) => e.type === 'red_card').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-profile-title"
    >
      <div className="w-full max-w-xl max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-xl border border-white/[0.12] bg-[#111114] text-[#F5F5F4] pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/[0.08] bg-[#111114] px-4 sm:px-5 py-3.5 sm:py-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {team && (
              <TeamCrest
                name={team.name}
                shortName={team.shortName}
                primaryColor={team.primaryColor}
                secondaryColor={team.secondaryColor}
                motif={team.motif}
                logoUrl={team.logoUrl}
                size="md"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs text-zinc-400 leading-snug">
                {team?.name ?? 'Club'} · Dorsal #{player.dorsal}
                {player.status === 'archived' ? ' · Baja / Archivado' : ''}
              </p>
              <h2 id="player-profile-title" className="font-display text-xl sm:text-2xl font-bold tracking-wide leading-tight">
                {player.name}
              </h2>
              <p className="text-xs text-[#D4AF37] font-medium leading-snug">
                {getPositionLabel(player.primaryPosition)} ({player.primaryPosition})
                {player.secondaryPosition
                  ? ` · Secundaria: ${getPositionLabel(player.secondaryPosition)} (${player.secondaryPosition})`
                  : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha de jugador"
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-md border border-white/[0.1] bg-[#0D0D10] text-zinc-300 hover:text-white hover:border-white/25 transition-colors shrink-0 cursor-pointer touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {/* Hairline-divided Numeric Stats Strip */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.08] rounded-lg border border-white/[0.08] bg-[#0D0D10]">
            <div className="p-3.5 text-center">
              <div className="font-mono-num text-2xl font-bold text-[#D4AF37]">{goalsCount}</div>
              <div className="mt-1 text-xs text-zinc-400">Goles</div>
            </div>
            <div className="p-3.5 text-center">
              <div className="font-mono-num text-2xl font-bold text-amber-400">{yellowsCount}</div>
              <div className="mt-1 text-xs text-zinc-400">Amarillas</div>
            </div>
            <div className="p-3.5 text-center">
              <div className="font-mono-num text-2xl font-bold text-rose-400">{redsCount}</div>
              <div className="mt-1 text-xs text-zinc-400">Rojas</div>
            </div>
          </div>

          {/* Disciplinary official state */}
          {disc?.isSuspended ? (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-300">
                  Sanción activa: {disc.pendingMatches} partido(s) pendiente(s)
                </p>
                <p className="mt-1 text-xs text-zinc-300">{disc.suspensionReason}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-white/[0.08] bg-[#0D0D10] p-4 flex items-center gap-3">
              <Award className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs text-zinc-300">
                Estado oficial: <span className="font-semibold text-emerald-400">Habilitado para jugar</span>
                {disc && disc.yellowCards > 0
                  ? ` · Acumulación actual: ${disc.yellowCycleCount} amarilla(s) (faltan ${disc.yellowUntilSuspension} para suspensión)`
                  : ''}
              </div>
            </div>
          )}

          {/* Club History & Transfers */}
          <div data-testid="player-club-history">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                <span>Equipos en los que ha jugado</span>
              </h3>
              {hasTransfers && (
                <span className="text-[11px] font-semibold text-[#D4AF37]">
                  Transferido
                </span>
              )}
            </div>

            <ul className="divide-y divide-white/[0.07] rounded-lg border border-white/[0.08] bg-[#0D0D10]">
              {clubHistory.map((stint, idx) => (
                <li
                  key={`${stint.teamName}-${stint.status}-${idx}`}
                  className="px-4 py-3 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {stint.team ? (
                      <TeamCrest
                        name={stint.team.name}
                        shortName={stint.team.shortName}
                        primaryColor={stint.team.primaryColor}
                        secondaryColor={stint.team.secondaryColor}
                        motif={stint.team.motif}
                        logoUrl={stint.team.logoUrl}
                        size="xs"
                      />
                    ) : (
                      <span className="w-7 h-7 rounded-md border border-white/[0.12] bg-[#111114] flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">
                        EX
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        <span className="font-semibold text-[#F5F5F4]">{stint.teamName}</span>
                        {stint.dorsal !== undefined && (
                          <span className="font-mono-num text-zinc-400">#{stint.dorsal}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        {stint.status === 'current'
                          ? hasTransfers
                            ? 'Club actual tras transferencia'
                            : 'Club actual en este torneo'
                          : `Club anterior · Transferido a ${stint.toTeamName ?? team?.name ?? 'club actual'}`}
                      </p>
                      {stint.reason && (
                        <p className="mt-0.5 text-[11px] text-zinc-300">{stint.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[11px] font-semibold ${
                        stint.status === 'current' ? 'text-emerald-400' : 'text-zinc-400'
                      }`}
                    >
                      {stint.status === 'current' ? 'Actual' : 'Anterior'}
                    </span>
                    {stint.dateLabel && (
                      <div className="mt-0.5 text-[10px] text-zinc-500">
                        {formatMatchDate(stint.dateLabel)}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Historical Event Log */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-2.5">
              Historial de goles, tarjetas y anotaciones
            </h3>
            {playerEvents.length === 0 ? (
              <p className="rounded-lg border border-white/[0.08] bg-[#0D0D10] p-4 text-xs text-zinc-400">
                Sin eventos oficiales registrados en este torneo.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.07] rounded-lg border border-white/[0.08] bg-[#0D0D10]">
                {playerEvents.map((ev) => {
                  const match = matches.find((m) => m.id === ev.matchId);
                  const eventTeamId = ev.teamId || player.teamId;
                  const oppId =
                    match && match.homeTeamId === eventTeamId
                      ? match.awayTeamId
                      : match?.homeTeamId;
                  const oppTeam = teams.find((t) => t.id === oppId);
                  const eventTeam = teams.find((t) => t.id === ev.teamId);

                  return (
                    <li key={ev.id} className="px-4 py-3 text-xs flex items-start justify-between gap-3">
                      <div>
                        <span className="font-semibold text-[#F5F5F4]">
                          {ev.type === 'goal'
                            ? 'Gol anotado'
                            : ev.type === 'yellow_card'
                              ? 'Tarjeta amarilla'
                              : ev.type === 'red_card'
                                ? 'Tarjeta roja'
                                : 'Anotación oficial'}
                        </span>
                        {match && (
                          <span className="text-zinc-400">
                            {' '}
                            · Jornada {match.jornada}
                            {eventTeam && ev.teamId !== player.teamId
                              ? ` con ${eventTeam.shortName}`
                              : ''}{' '}
                            vs {oppTeam?.shortName ?? 'Rival'}
                          </span>
                        )}
                        {ev.note && <p className="mt-1 text-zinc-300">{ev.note}</p>}
                      </div>
                      <span className="font-mono-num text-[#D4AF37] shrink-0">
                        {ev.minute ? `${ev.minute}'` : '—'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
