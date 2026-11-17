import { ArrowRight, Calendar, Clock, MapPin, Pause, ShieldAlert, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatMatchDate, formatMatchTime, getMatchStatusLabel, getMatchStatusTextColor } from '../lib/format';
import { computeLiveMatchClock, selectFeaturedMatchdayMatches } from '../lib/leagueEngine';
import type { PublicOverviewPayload } from '../types/league';
import { NewsTicker } from './NewsTicker';
import type { AppSection } from './TopBar';
import { TeamCrest } from './TeamCrest';

interface HomeViewProps {
  data: PublicOverviewPayload;
  onNavigate: (section: AppSection) => void;
  onSelectMatch: (matchId: string) => void;
  onSelectTeam: (teamId: string) => void;
  onSelectPlayer: (playerId: string) => void;
}

export function HomeView({
  data,
  onNavigate,
  onSelectMatch,
  onSelectTeam,
  onSelectPlayer,
}: HomeViewProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [ballImgFailed, setBallImgFailed] = useState(false);
  const [trophyImgFailed, setTrophyImgFailed] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const featuredMatches = selectFeaturedMatchdayMatches(data.matches, 2);
  const featuredIds = new Set(featuredMatches.map((m) => m.id));
  const primaryFeatured = featuredMatches[0];
  const hasLiveMatch = featuredMatches.some((m) => m.status === 'en_juego');
  const hasActiveTickingClock = featuredMatches.some(
    (m) => m.status === 'en_juego' && !m.liveClockPaused
  );
  const clockSyncKey = featuredMatches
    .map(
      (m) =>
        `${m.id}:${m.status}:${m.liveStartedAt ?? ''}:${m.liveClockPaused ? '1' : '0'}:${m.liveElapsedSeconds ?? 0}`
    )
    .join('|');

  useEffect(() => {
    if (!hasActiveTickingClock) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [hasActiveTickingClock, clockSyncKey]);

  const recentMatches = data.matches
    .filter((m) => !featuredIds.has(m.id))
    .slice()
    .sort((a, b) => {
      if (a.status === 'programado' && b.status !== 'programado') return -1;
      if (a.status !== 'programado' && b.status === 'programado') return 1;
      return new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime();
    })
    .slice(0, 4);

  const topStandings = data.standings.slice(0, 4);
  const topScorers = data.scorers.slice(0, 3);
  const suspendedCount = data.discipline.filter((d) => d.isSuspended).length;

  return (
    <div className="space-y-6">
      <NewsTicker
        data={data}
        onSelectMatch={onSelectMatch}
        onSelectPlayer={onSelectPlayer}
      />

      {/* Hero Banner: Featured Match + Coastal Stadium Photography */}
      <section className="relative overflow-hidden rounded-lg border border-white/[0.09] bg-[#111114]">
        {!heroImgFailed ? (
          <img
            src="/src/assets/images/hero_pitch_sjds_1794861450815.jpg"
            alt="Estadio iluminado en San Juan del Sur al atardecer"
            referrerPolicy="no-referrer"
            onError={() => setHeroImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        ) : (
          <div className="absolute inset-0 bg-[#111114]" />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-[#0A0A0A]/60"
        />

        <div className="relative z-10 grid gap-5 sm:gap-8 p-4 sm:p-8 lg:grid-cols-[1fr_1.15fr] lg:items-center">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-3">
            <p className="text-xs font-medium text-[#D4AF37]">
              {data.activeCompetition.name} · {data.activeCompetition.season}
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F5F4] text-balance leading-[1.05]">
              {hasLiveMatch ? 'Partidos en directo' : 'Próximos Encuentros'}
            </h1>
            <p className="max-w-md text-xs sm:text-base text-zinc-300 leading-relaxed">
              Calendario por jornada, marcadores al instante, tabla de posiciones automática,
              goleadores y registro de sanciones de San Juan del Sur.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 pt-1 w-full sm:w-auto">
              {primaryFeatured && (
                <button
                  type="button"
                  onClick={() => onSelectMatch(primaryFeatured.id)}
                  className="min-h-[44px] sm:min-h-[42px] inline-flex items-center justify-center gap-2 rounded-md bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E5C453] transition-colors whitespace-nowrap cursor-pointer touch-manipulation"
                >
                  <span>{hasLiveMatch ? 'Ver partido en vivo' : 'Ver primer duelo'}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('partidos')}
                className="min-h-[44px] sm:min-h-[42px] inline-flex items-center justify-center gap-2 rounded-md border border-white/[0.15] bg-[#0A0A0A]/85 px-5 py-2.5 text-sm font-semibold text-[#F5F5F4] hover:border-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer touch-manipulation"
              >
                <span>Calendario completo</span>
              </button>
            </div>
          </div>

          {/* Featured Matchday Panel */}
          {featuredMatches.length > 0 && primaryFeatured ? (
            <div className="rounded-lg border border-white/[0.12] bg-[#0B0B0E]/95 p-3.5 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs border-b border-white/[0.08] pb-2.5 sm:pb-3">
                <span className="text-zinc-300 font-medium">
                  Jornada {primaryFeatured.jornada} · {formatMatchDate(primaryFeatured.kickoffAt)}
                </span>
                {hasLiveMatch ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#D4AF37]">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] animate-pulse"
                      aria-hidden="true"
                    />
                    <span>En vivo</span>
                  </span>
                ) : (
                  <span className="text-[#D4AF37] font-semibold">
                    {featuredMatches.length === 2 ? 'Doble cartelera' : 'Partido del día'}
                  </span>
                )}
              </div>

              <div className="divide-y divide-white/[0.07]">
                {featuredMatches.map((match, idx) => {
                  const home = data.teams.find((t) => t.id === match.homeTeamId);
                  const away = data.teams.find((t) => t.id === match.awayTeamId);
                  if (!home || !away) return null;
                  const matchClock = computeLiveMatchClock(match, nowMs);
                  const showTime = match.status === 'programado' || match.status === 'suspendido';
                  const isPrimaryLive = hasLiveMatch && idx === 0 && match.status === 'en_juego';
                  const isCompactUpcoming = hasLiveMatch && !isPrimaryLive;

                  const crestSize = isPrimaryLive ? 'lg' : isCompactUpcoming ? 'sm' : 'md';
                  const rowPadding = isPrimaryLive
                    ? 'pt-3.5 pb-3.5 sm:pt-4 sm:pb-4'
                    : isCompactUpcoming
                      ? 'pt-3 pb-0.5'
                      : idx === 0
                        ? 'pt-3 pb-3 sm:pt-3.5 sm:pb-3.5'
                        : 'pt-3 pb-0.5 sm:pt-3.5 sm:pb-1';
                  const gridCols = isPrimaryLive
                    ? 'grid-cols-[1fr_92px_1fr] sm:grid-cols-[1fr_144px_1fr] gap-1.5 sm:gap-3'
                    : isCompactUpcoming
                      ? 'grid-cols-[1fr_86px_1fr] sm:grid-cols-[1fr_120px_1fr] gap-1.5 sm:gap-2'
                      : 'grid-cols-[1fr_88px_1fr] sm:grid-cols-[1fr_124px_1fr] gap-1.5 sm:gap-3';

                  return (
                    <div
                      key={match.id}
                      data-testid={isPrimaryLive ? 'featured-primary-live' : isCompactUpcoming ? 'featured-compact-next' : 'featured-match-row'}
                      className={rowPadding}
                    >
                      <div className={`grid items-center ${gridCols}`}>
                        <button
                          type="button"
                          onClick={() => onSelectTeam(home.id)}
                          className="min-h-[44px] flex flex-col items-center justify-center text-center gap-1.5 rounded-md py-1 px-1 hover:bg-white/[0.04] transition-colors cursor-pointer"
                        >
                          <TeamCrest
                            name={home.name}
                            shortName={home.shortName}
                            primaryColor={home.primaryColor}
                            secondaryColor={home.secondaryColor}
                            motif={home.motif}
                            logoUrl={home.logoUrl}
                            size={crestSize}
                          />
                          <span
                            className={`leading-tight max-w-full ${
                              isPrimaryLive
                                ? 'text-[13px] sm:text-base font-bold text-[#F5F5F4] line-clamp-2'
                                : isCompactUpcoming
                                  ? 'text-[11px] sm:text-xs font-medium text-zinc-200 line-clamp-2'
                                  : 'text-xs sm:text-sm font-semibold text-[#F5F5F4] line-clamp-2'
                            }`}
                          >
                            {home.name}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectMatch(match.id)}
                          aria-label={`Ver acta de ${home.name} contra ${away.name}`}
                          className="min-h-[44px] flex flex-col items-center justify-center text-center rounded-md py-1.5 px-1 hover:bg-white/[0.05] transition-colors cursor-pointer"
                        >
                          <span
                            className={`font-mono-num font-bold text-[#F5F5F4] whitespace-nowrap leading-none ${
                              isPrimaryLive
                                ? 'text-2xl sm:text-4xl'
                                : isCompactUpcoming
                                  ? showTime
                                    ? 'text-xs sm:text-sm text-zinc-200'
                                    : 'text-base sm:text-xl'
                                  : showTime
                                    ? 'text-sm sm:text-base'
                                    : 'text-xl sm:text-3xl'
                            }`}
                          >
                            {showTime
                              ? formatMatchTime(match.kickoffAt)
                              : `${match.homeScore} - ${match.awayScore}`}
                          </span>

                          {matchClock ? (
                            <span
                              data-testid="home-live-clock"
                              className={`inline-flex items-center gap-1 font-mono-num font-bold whitespace-nowrap ${
                                isPrimaryLive ? 'mt-2 text-xs sm:text-sm' : 'mt-1.5 text-[11px]'
                              } ${matchClock.isPaused ? 'text-amber-300' : 'text-[#D4AF37]'}`}
                            >
                              {matchClock.isPaused ? (
                                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                              <span>
                                {matchClock.formattedClock} ·{' '}
                                {matchClock.isPaused ? 'Pausa' : `${matchClock.minute}'`}
                              </span>
                            </span>
                          ) : (
                            <span
                              className={`mt-1 font-medium whitespace-nowrap ${
                                isCompactUpcoming
                                  ? 'text-[10px] text-zinc-400'
                                  : `text-[11px] ${getMatchStatusTextColor(match.status)}`
                              }`}
                            >
                              {isCompactUpcoming && match.status === 'programado'
                                ? 'A continuación'
                                : getMatchStatusLabel(match.status, match.liveMinute)}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectTeam(away.id)}
                          className="min-h-[44px] flex flex-col items-center justify-center text-center gap-1.5 rounded-md py-1 px-1 hover:bg-white/[0.04] transition-colors cursor-pointer"
                        >
                          <TeamCrest
                            name={away.name}
                            shortName={away.shortName}
                            primaryColor={away.primaryColor}
                            secondaryColor={away.secondaryColor}
                            motif={away.motif}
                            logoUrl={away.logoUrl}
                            size={crestSize}
                          />
                          <span
                            className={`leading-tight max-w-full ${
                              isPrimaryLive
                                ? 'text-[13px] sm:text-base font-bold text-[#F5F5F4] line-clamp-2'
                                : isCompactUpcoming
                                  ? 'text-[11px] sm:text-xs font-medium text-zinc-200 line-clamp-2'
                                  : 'text-xs sm:text-sm font-semibold text-[#F5F5F4] line-clamp-2'
                            }`}
                          >
                            {away.name}
                          </span>
                        </button>
                      </div>

                      <div
                        className={`flex items-center justify-center gap-2 text-zinc-400 ${
                          isPrimaryLive
                            ? 'mt-2.5 text-xs'
                            : isCompactUpcoming
                              ? 'mt-1 text-[10px]'
                              : 'mt-1.5 text-[11px]'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1 truncate max-w-[190px] sm:max-w-none">
                          <MapPin className="w-3 h-3 text-[#D4AF37] shrink-0" aria-hidden="true" />
                          <span className="truncate">{match.venue}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <button
                          type="button"
                          onClick={() => onSelectMatch(match.id)}
                          className="text-[#D4AF37] hover:underline font-medium whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Ver resultados
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-white/[0.08] bg-[#0B0B0E]/85 p-6 text-center text-sm text-zinc-400">
              Aún no hay partidos programados en esta competencia.
            </div>
          )}
        </div>
      </section>

      {/* Main 2-Column Content Grid */}
      <section className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: Standings Top 4 + Clubes Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 sm:px-5 py-3.5 sm:py-4">
              <div className="min-w-0">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-[#F5F5F4]">
                  Tabla de Posiciones
                </h2>
                <p className="text-[11px] sm:text-xs text-zinc-400">
                  Cálculo automático por partidos finalizados y ajustes oficiales
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tablas')}
                className="min-h-[38px] inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:text-[#E5C453] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Ver completa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-white/[0.08] text-[11px] sm:text-xs text-zinc-400 bg-[#0D0D10]">
                  <tr>
                    <th className="py-2.5 pl-3.5 pr-1.5 sm:pl-5 sm:pr-2 font-medium w-8">#</th>
                    <th className="py-2.5 px-1.5 sm:px-2 font-medium">Equipo</th>
                    <th className="py-2.5 px-1.5 sm:px-2 text-right font-medium">PJ</th>
                    <th className="py-2.5 px-1.5 sm:px-2 text-right font-medium">DG</th>
                    <th className="py-2.5 pl-1.5 pr-3.5 sm:pl-2 sm:pr-5 text-right font-medium text-[#D4AF37]">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {topStandings.map((row) => (
                    <tr
                      key={row.teamId}
                      className={`transition-colors ${
                        row.eliminated
                          ? 'bg-rose-950/30 hover:bg-rose-950/45'
                          : 'hover:bg-white/[0.025]'
                      }`}
                    >
                      <td
                        className={`py-3 pl-3.5 pr-1.5 sm:pl-5 sm:pr-2 font-mono-num text-xs ${
                          row.eliminated ? 'text-rose-400 font-semibold' : 'text-zinc-400'
                        }`}
                      >
                        {row.position}
                      </td>
                      <td className="py-3 px-1.5 sm:px-2">
                        <button
                          type="button"
                          onClick={() => onSelectTeam(row.teamId)}
                          className={`flex items-center gap-2 sm:gap-2.5 text-left font-medium transition-colors cursor-pointer min-w-0 ${
                            row.eliminated
                              ? 'text-rose-200 hover:text-rose-100'
                              : 'text-[#F5F5F4] hover:text-[#D4AF37]'
                          }`}
                        >
                          <TeamCrest
                            name={row.teamName}
                            shortName={row.shortName}
                            primaryColor={row.primaryColor}
                            secondaryColor={row.secondaryColor}
                            motif={row.motif}
                            logoUrl={row.logoUrl}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <span className="block sm:inline leading-snug break-words">
                              {row.teamName}
                            </span>
                            {row.eliminated && (
                              <span className="block sm:inline sm:ml-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-400 shrink-0">
                                · Eliminado
                              </span>
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-1.5 sm:px-2 text-right font-mono-num text-zinc-300">{row.pj}</td>
                      <td className="py-3 px-1.5 sm:px-2 text-right font-mono-num text-zinc-300">
                        {row.dif > 0 ? `+${row.dif}` : row.dif}
                      </td>
                      <td
                        className={`py-3 pl-1.5 pr-3.5 sm:pl-2 sm:pr-5 text-right font-mono-num font-bold ${
                          row.eliminated ? 'text-rose-400' : 'text-[#D4AF37]'
                        }`}
                      >
                        {row.pts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clubes Hairline Grid */}
          <div className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 sm:px-5 py-3.5 sm:py-4">
              <div className="min-w-0">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-[#F5F5F4]">
                  Clubes participantes
                </h2>
                <p className="text-[11px] sm:text-xs text-zinc-400">
                  Acceso directo a plantel, cuerpo técnico y disciplina de cada club
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('equipos')}
                className="min-h-[38px] inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:text-[#E5C453] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Todos ({data.teams.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-white/[0.07]">
              {data.teams.slice(0, 6).map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => onSelectTeam(team.id)}
                  className="flex items-center gap-3 bg-[#111114] px-4 py-3 sm:p-3.5 text-left hover:bg-[#17171B] transition-colors cursor-pointer touch-manipulation"
                >
                  <TeamCrest
                    name={team.name}
                    shortName={team.shortName}
                    primaryColor={team.primaryColor}
                    secondaryColor={team.secondaryColor}
                    motif={team.motif}
                    logoUrl={team.logoUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-xs font-semibold text-[#F5F5F4] sm:truncate leading-snug">
                      {team.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">{team.neighborhood}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Recent/Upcoming Matches + Scorers + Discipline */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 sm:px-5 py-3.5 sm:py-4">
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-[#F5F5F4]">
                Agenda y resultados
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('partidos')}
                className="min-h-[38px] inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:text-[#E5C453] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Jornadas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-white/[0.07]">
              {recentMatches.map((m) => {
                const home = data.teams.find((t) => t.id === m.homeTeamId);
                const away = data.teams.find((t) => t.id === m.awayTeamId);
                if (!home || !away) return null;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMatch(m.id)}
                    className="w-full px-5 py-3.5 text-left hover:bg-white/[0.025] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
                      <span>
                        Jornada {m.jornada} · {formatMatchDate(m.kickoffAt)}
                      </span>
                      <span className={getMatchStatusTextColor(m.status)}>
                        {getMatchStatusLabel(m.status, m.liveMinute)}
                      </span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <TeamCrest
                          name={home.name}
                          shortName={home.shortName}
                          primaryColor={home.primaryColor}
                          secondaryColor={home.secondaryColor}
                          motif={home.motif}
                          logoUrl={home.logoUrl}
                          size="xs"
                        />
                        <span className="truncate font-medium text-[#F5F5F4]">{home.shortName}</span>
                      </div>
                      <span className="font-mono-num text-sm font-bold text-[#F5F5F4] px-2 text-center min-w-[92px] whitespace-nowrap">
                        {m.status === 'programado' || m.status === 'suspendido'
                          ? formatMatchTime(m.kickoffAt)
                          : `${m.homeScore} - ${m.awayScore}`}
                      </span>
                      <div className="flex items-center justify-end gap-2 min-w-0 flex-1">
                        <span className="truncate font-medium text-[#F5F5F4]">{away.shortName}</span>
                        <TeamCrest
                          name={away.name}
                          shortName={away.shortName}
                          primaryColor={away.primaryColor}
                          secondaryColor={away.secondaryColor}
                          motif={away.motif}
                          logoUrl={away.logoUrl}
                          size="xs"
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goleadores & Disciplina Flat Split Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#111114]">
              <div className="grid grid-cols-[1fr_84px] sm:grid-cols-[1fr_104px] items-stretch">
                <div className="p-4 sm:p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-[#D4AF37]">
                      <Trophy className="w-3.5 h-3.5 shrink-0" />
                      <span>Líderes de goleo</span>
                    </div>
                    {topScorers.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {topScorers.map((s) => (
                          <li key={s.playerId} className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate text-[#F5F5F4] font-medium">
                              {s.position}. {s.playerName}
                            </span>
                            <span className="font-mono-num font-bold text-[#D4AF37] shrink-0">
                              {s.goals} {s.goals === 1 ? 'gol' : 'goles'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-zinc-400">Sin goles registrados aún.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('tablas')}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    <span>Ver tabla de goleadores</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="relative min-h-[140px] bg-[#0A0A0A] border-l border-white/[0.07]">
                  {!trophyImgFailed ? (
                    <img
                      src="/src/assets/images/trophy_copa_sjds_1794861451375.jpg"
                      alt="Trofeo oficial de la liga"
                      referrerPolicy="no-referrer"
                      onError={() => setTrophyImgFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-[#14120C]">
                      <Trophy className="w-8 h-8 text-[#D4AF37]/60" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-[#111114]">
              <div className="grid grid-cols-[1fr_84px] sm:grid-cols-[1fr_104px] items-stretch">
                <div className="p-4 sm:p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>Sanciones</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#F5F5F4]">
                      {suspendedCount === 0
                        ? 'Sin jugadores suspendidos'
                        : `${suspendedCount} jugador(es) con sanción activa`}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Regla: {data.activeCompetition.rules.yellowAccumulationLimit} amarillas o roja
                      directa ({data.activeCompetition.rules.redCardSuspensionMatches} p.).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('disciplina')}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    <span>Consultar sanciones</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="relative min-h-[140px] bg-[#0A0A0A] border-l border-white/[0.07]">
                  {!ballImgFailed ? (
                    <img
                      src="/src/assets/images/matchday_ball_turf_1794861452648.jpg"
                      alt="Balón oficial sobre la línea de cal"
                      referrerPolicy="no-referrer"
                      onError={() => setBallImgFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-[#111412]">
                      <Calendar className="w-8 h-8 text-[#D4AF37]/60" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
