import { Calendar, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatMatchDate, formatMatchTime, getMatchStatusLabel, getMatchStatusTextColor } from '../lib/format';
import type { Match, MatchStatus, Team } from '../types/league';
import { FlatSelect } from './FlatSelect';
import { TeamCrest } from './TeamCrest';

interface MatchesViewProps {
  matches: Match[];
  teams: Team[];
  onSelectMatch: (matchId: string) => void;
}

const STATUS_FILTERS: Array<{ id: 'all' | MatchStatus; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'en_juego', label: 'En juego' },
  { id: 'programado', label: 'Programados' },
  { id: 'finalizado', label: 'Finalizados' },
  { id: 'suspendido', label: 'Suspendidos' },
];

export function MatchesView({ matches, teams, onSelectMatch }: MatchesViewProps) {
  const jornadas = useMemo(() => {
    const set = new Set(matches.map((m) => m.jornada));
    return Array.from(set).sort((a, b) => a - b);
  }, [matches]);

  const [selectedJornada, setSelectedJornada] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MatchStatus>('all');

  const filteredMatches = useMemo(() => {
    return matches
      .filter((m) => (selectedJornada === 'all' ? true : m.jornada === selectedJornada))
      .filter((m) => (statusFilter === 'all' ? true : m.status === statusFilter))
      .slice()
      .sort((a, b) => {
        if (a.jornada !== b.jornada) return a.jornada - b.jornada;
        return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
      });
  }, [matches, selectedJornada, statusFilter]);

  const groupedByJornada = useMemo(() => {
    const map = new Map<number, Match[]>();
    for (const m of filteredMatches) {
      if (!map.has(m.jornada)) map.set(m.jornada, []);
      map.get(m.jornada)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredMatches]);

  const statusOptions = useMemo(
    () =>
      STATUS_FILTERS.map((st) => {
        const count =
          st.id === 'all'
            ? matches.length
            : matches.filter((m) => m.status === st.id).length;
        return {
          value: st.id,
          label: st.id === 'all' ? `Estado: Todos (${count})` : `${st.label} (${count})`,
        };
      }),
    [matches]
  );

  const jornadaOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas las jornadas' },
      ...jornadas.map((j) => ({
        value: String(j),
        label: `Jornada ${j}`,
        meta: `${matches.filter((m) => m.jornada === j).length} partidos`,
      })),
    ],
    [jornadas, matches]
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3.5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-[#F5F5F4]">
            Calendario y Resultados
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Toca cualquier partido para consultar el acta oficial, goles y tarjetas.
          </p>
        </div>

        {/* Desktop Status Segmented Filter */}
        <div className="hidden md:flex flex-wrap items-center gap-1 rounded-lg border border-white/[0.08] bg-[#111114] p-1">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-[#D4AF37] text-[#0A0A0A] font-semibold'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Compact 2-Column Filters */}
      <div className="md:hidden grid grid-cols-2 gap-2.5">
        <FlatSelect
          id="mobile-match-status-filter"
          ariaLabel="Filtrar partidos por estado"
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as 'all' | MatchStatus)}
          options={statusOptions}
          size="sm"
          triggerBgClassName="bg-[#111114]"
        />
        <FlatSelect
          id="mobile-match-jornada-filter"
          ariaLabel="Filtrar partidos por jornada"
          value={selectedJornada === 'all' ? 'all' : String(selectedJornada)}
          onChange={(val) => setSelectedJornada(val === 'all' ? 'all' : Number(val))}
          options={jornadaOptions}
          size="sm"
          align="right"
          triggerBgClassName="bg-[#111114]"
        />
      </div>

      {/* Desktop Jornada Selector */}
      {jornadas.length > 0 && (
        <div className="hidden md:flex items-center gap-1.5 border-b border-white/[0.08] overflow-x-auto pb-2.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedJornada('all')}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedJornada === 'all'
                ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            Todas las jornadas
          </button>
          {jornadas.map((j) => (
            <button
              key={j}
              type="button"
              onClick={() => setSelectedJornada(j)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedJornada === j
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              Jornada {j}
            </button>
          ))}
        </div>
      )}

      {/* Matches List */}
      {groupedByJornada.length === 0 ? (
        <div className="rounded-lg border border-white/[0.08] bg-[#111114] p-8 sm:p-10 text-center">
          <p className="text-sm text-zinc-300">
            No hay partidos que coincidan con el filtro seleccionado.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedJornada('all');
              setStatusFilter('all');
            }}
            className="mt-4 min-h-[40px] rounded-md border border-white/[0.12] px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:border-[#D4AF37] cursor-pointer"
          >
            Mostrar todos los partidos
          </button>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {groupedByJornada.map(([jornada, jornadaMatches]) => (
            <section key={jornada} className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <h2 className="font-display text-xl font-bold tracking-wide text-[#D4AF37]">
                  Jornada {jornada}
                </h2>
                <span className="text-xs text-zinc-400">
                  {jornadaMatches.length} encuentro(s)
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {jornadaMatches.map((match) => {
                  const home = teams.find((t) => t.id === match.homeTeamId);
                  const away = teams.find((t) => t.id === match.awayTeamId);
                  if (!home || !away) return null;

                  return (
                    <button
                      key={match.id}
                      type="button"
                      onClick={() => onSelectMatch(match.id)}
                      className="flex flex-col justify-between rounded-lg border border-white/[0.08] bg-[#111114] p-3.5 sm:p-4 text-left hover:border-[#D4AF37]/45 hover:bg-[#151519] transition-colors cursor-pointer touch-manipulation"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-white/[0.07] pb-2.5">
                        <span className="inline-flex items-center gap-1.5 text-zinc-400">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{formatMatchDate(match.kickoffAt)} · {formatMatchTime(match.kickoffAt)}</span>
                        </span>
                        <span className={`font-semibold ${getMatchStatusTextColor(match.status)}`}>
                          {getMatchStatusLabel(match.status, match.liveMinute)}
                        </span>
                      </div>

                      <div className="my-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <TeamCrest
                              name={home.name}
                              shortName={home.shortName}
                              primaryColor={home.primaryColor}
                              secondaryColor={home.secondaryColor}
                              motif={home.motif}
                              logoUrl={home.logoUrl}
                              size="sm"
                            />
                            <span className="font-semibold text-sm text-[#F5F5F4] truncate">
                              {home.name}
                            </span>
                          </div>
                          <span className="font-mono-num text-lg font-bold text-[#F5F5F4]">
                            {match.status === 'programado' || match.status === 'suspendido'
                              ? '—'
                              : match.homeScore}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <TeamCrest
                              name={away.name}
                              shortName={away.shortName}
                              primaryColor={away.primaryColor}
                              secondaryColor={away.secondaryColor}
                              motif={away.motif}
                              logoUrl={away.logoUrl}
                              size="sm"
                            />
                            <span className="font-semibold text-sm text-[#F5F5F4] truncate">
                              {away.name}
                            </span>
                          </div>
                          <span className="font-mono-num text-lg font-bold text-[#F5F5F4]">
                            {match.status === 'programado' || match.status === 'suspendido'
                              ? '—'
                              : match.awayScore}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-white/[0.07] pt-2.5">
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                          <span className="truncate">{match.venue}</span>
                        </span>
                        <span className="text-[#D4AF37] font-medium shrink-0 ml-2">
                          Ver acta
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
