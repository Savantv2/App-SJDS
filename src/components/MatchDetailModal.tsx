import { Calendar, MapPin, User, X } from 'lucide-react';
import { formatMatchDate, formatMatchTime, getMatchStatusLabel, getMatchStatusTextColor } from '../lib/format';
import type { Match, MatchEvent, Player, Team } from '../types/league';
import { TeamCrest } from './TeamCrest';

interface MatchDetailModalProps {
  match: Match | null;
  teams: Team[];
  players: Player[];
  events: MatchEvent[];
  onClose: () => void;
  onSelectTeam: (teamId: string) => void;
  onSelectPlayer: (playerId: string) => void;
}

export function MatchDetailModal({
  match,
  teams,
  players,
  events,
  onClose,
  onSelectTeam,
  onSelectPlayer,
}: MatchDetailModalProps) {
  if (!match) return null;

  const homeTeam = teams.find((t) => t.id === match.homeTeamId);
  const awayTeam = teams.find((t) => t.id === match.awayTeamId);
  if (!homeTeam || !awayTeam) return null;

  const matchEvents = events
    .filter((e) => e.matchId === match.id)
    .slice()
    .sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));

  const getPlayer = (id?: string) => players.find((p) => p.id === id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-detail-title"
    >
      <div className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-xl border border-white/[0.12] bg-[#111114] text-[#F5F5F4] pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#111114] px-4 sm:px-5 py-3.5 sm:py-4">
          <div className="min-w-0 pr-2">
            <p className="text-xs text-zinc-400">
              Jornada {match.jornada} ·{' '}
              <span className={getMatchStatusTextColor(match.status)}>
                {getMatchStatusLabel(match.status, match.liveMinute)}
              </span>
            </p>
            <h2 id="match-detail-title" className="font-display text-xl font-bold tracking-wide">
              Acta oficial del encuentro
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar acta de partido"
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-md border border-white/[0.1] bg-[#0D0D10] text-zinc-300 hover:text-white hover:border-white/25 transition-colors shrink-0 cursor-pointer touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scoreboard */}
        <div className="border-b border-white/[0.08] bg-[#0D0D10] px-4 sm:px-5 py-5 sm:py-6">
          <div className="grid grid-cols-[1fr_76px_1fr] sm:grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectTeam(homeTeam.id);
              }}
              className="flex flex-col items-center text-center gap-2 hover:opacity-90 transition-opacity cursor-pointer min-w-0"
            >
              <TeamCrest
                name={homeTeam.name}
                shortName={homeTeam.shortName}
                primaryColor={homeTeam.primaryColor}
                secondaryColor={homeTeam.secondaryColor}
                motif={homeTeam.motif}
                logoUrl={homeTeam.logoUrl}
                size="lg"
              />
              <span className="text-xs sm:text-base font-semibold leading-tight line-clamp-2">
                {homeTeam.name}
              </span>
              <span className="text-[11px] sm:text-xs text-zinc-400">Local</span>
            </button>

            <div className="flex flex-col items-center">
              <div className="font-mono-num text-2xl sm:text-4xl font-bold tracking-tight text-[#F5F5F4] whitespace-nowrap">
                {match.status === 'programado' || match.status === 'suspendido'
                  ? 'VS'
                  : `${match.homeScore} - ${match.awayScore}`}
              </div>
              <span className={`mt-1 text-[11px] sm:text-xs font-medium text-center ${getMatchStatusTextColor(match.status)}`}>
                {getMatchStatusLabel(match.status, match.liveMinute)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectTeam(awayTeam.id);
              }}
              className="flex flex-col items-center text-center gap-2 hover:opacity-90 transition-opacity cursor-pointer min-w-0"
            >
              <TeamCrest
                name={awayTeam.name}
                shortName={awayTeam.shortName}
                primaryColor={awayTeam.primaryColor}
                secondaryColor={awayTeam.secondaryColor}
                motif={awayTeam.motif}
                logoUrl={awayTeam.logoUrl}
                size="lg"
              />
              <span className="text-xs sm:text-base font-semibold leading-tight line-clamp-2">
                {awayTeam.name}
              </span>
              <span className="text-[11px] sm:text-xs text-zinc-400">Visitante</span>
            </button>
          </div>

          <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
              {formatMatchDate(match.kickoffAt)} · {formatMatchTime(match.kickoffAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              {match.venue}
            </span>
            {match.referee && (
              <span className="inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                {match.referee}
              </span>
            )}
          </div>
        </div>

        {/* Events Timeline */}
        <div className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-200">
            Cronología de eventos ({matchEvents.length})
          </h3>

          {matchEvents.length === 0 ? (
            <div className="rounded-lg border border-white/[0.08] bg-[#0D0D10] p-6 text-center text-sm text-zinc-400">
              {match.status === 'programado'
                ? 'Este encuentro aún no inicia. Los goles, tarjetas y anotaciones aparecerán aquí al comenzar.'
                : 'No hay eventos registrados en el acta de este partido.'}
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.07] rounded-lg border border-white/[0.08] bg-[#0D0D10]">
              {matchEvents.map((ev) => {
                const evTeam = teams.find((t) => t.id === ev.teamId);
                const evPlayer = getPlayer(ev.playerId);
                return (
                  <li key={ev.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="font-mono-num text-xs font-semibold text-[#D4AF37] min-w-[34px] pt-0.5">
                        {ev.minute ? `${ev.minute}'` : '—'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          {ev.type === 'goal' && (
                            <span className="font-semibold text-emerald-400">Gol</span>
                          )}
                          {ev.type === 'yellow_card' && (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-400">
                              <span className="inline-block w-2.5 h-3.5 rounded-[2px] bg-amber-400" aria-hidden="true" />
                              Tarjeta amarilla
                            </span>
                          )}
                          {ev.type === 'red_card' && (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-rose-400">
                              <span className="inline-block w-2.5 h-3.5 rounded-[2px] bg-rose-500" aria-hidden="true" />
                              Tarjeta roja
                            </span>
                          )}
                          {ev.type === 'special_note' && (
                            <span className="font-semibold text-zinc-200">
                              Anotación oficial
                            </span>
                          )}
                          {evTeam && (
                            <span className="text-xs text-zinc-400">· {evTeam.shortName}</span>
                          )}
                        </div>
                        {evPlayer && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectPlayer(evPlayer.id);
                            }}
                            className="mt-0.5 text-sm text-[#F5F5F4] hover:text-[#D4AF37] transition-colors text-left cursor-pointer"
                          >
                            #{evPlayer.dorsal} {evPlayer.name}
                            {evPlayer.status === 'archived' ? ' (Archivado)' : ''}
                          </button>
                        )}
                        {ev.note && (
                          <p className="mt-1 text-xs text-zinc-300 leading-relaxed">{ev.note}</p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
