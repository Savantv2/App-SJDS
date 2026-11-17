import { AlertTriangle, FileText, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CompetitionRules, DisciplinePlayerRow, Team } from '../types/league';
import { FlatSelect } from './FlatSelect';

interface DisciplineViewProps {
  discipline: DisciplinePlayerRow[];
  teams: Team[];
  rules: CompetitionRules;
  onSelectPlayer: (playerId: string) => void;
}

export function DisciplineView({
  discipline,
  teams,
  rules,
  onSelectPlayer,
}: DisciplineViewProps) {
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [onlySuspended, setOnlySuspended] = useState(false);
  const [showAllSuspensions, setShowAllSuspensions] = useState(false);

  const filtered = useMemo(() => {
    return discipline
      .filter((d) => (teamFilter === 'all' ? true : d.teamId === teamFilter))
      .filter((d) => (onlySuspended ? d.isSuspended : true));
  }, [discipline, teamFilter, onlySuspended]);

  const suspendedPlayers = discipline.filter((d) => d.isSuspended);
  const publicNotesList = discipline.flatMap((d) =>
    d.publicNotes.map((n) => ({
      ...n,
      playerName: d.playerName,
      teamName: d.teamName,
      playerId: d.playerId,
    }))
  );

  const teamOptions = [
    { value: 'all', label: 'Todos los clubes' },
    ...teams.map((t) => ({
      value: t.id,
      label: t.name,
      meta: t.neighborhood,
    })),
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-[#F5F5F4]">
            Tarjetas y Sanciones
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Acumulación de {rules.yellowAccumulationLimit} amarillas = 1 partido de suspensión · Roja
            directa = {rules.redCardSuspensionMatches} partido(s). Solo se publica información
            oficial revisada.
          </p>
        </div>
      </div>

      {/* Active Suspensions Summary */}
      <section className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-hidden">
        <div className="flex items-center justify-between gap-2 text-sm font-semibold text-[#F5F5F4] px-4 sm:px-5 py-3 sm:py-3.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            {suspendedPlayers.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>Sanciones activas ({suspendedPlayers.length})</span>
          </div>
          {suspendedPlayers.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllSuspensions((v) => !v)}
              className="sm:hidden text-xs font-semibold text-[#D4AF37] hover:text-[#E5C453] cursor-pointer touch-manipulation"
            >
              {showAllSuspensions ? 'Ver menos' : `Ver todas (${suspendedPlayers.length})`}
            </button>
          )}
        </div>

        {suspendedPlayers.length === 0 ? (
          <p className="px-4 sm:px-5 py-4 text-xs text-zinc-400">
            No hay jugadores con partidos de suspensión pendientes en esta competencia.
          </p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.07]">
              {suspendedPlayers.map((s, idx) => (
                <button
                  key={s.playerId}
                  type="button"
                  onClick={() => onSelectPlayer(s.playerId)}
                  className={`${
                    !showAllSuspensions && idx >= 3 ? 'hidden sm:block' : 'block'
                  } bg-rose-950/15 p-3.5 sm:p-4 text-left hover:bg-rose-950/30 transition-colors cursor-pointer touch-manipulation`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-[#F5F5F4] leading-snug">
                      #{s.dorsal} {s.playerName}
                    </span>
                    <span className="font-mono-num text-xs font-bold text-rose-300 shrink-0">
                      {s.pendingMatches} p. pend.
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{s.teamName}</p>
                  <p className="mt-1.5 text-xs text-rose-200 leading-snug">{s.suspensionReason}</p>
                </button>
              ))}
            </div>
            {suspendedPlayers.length > 3 && !showAllSuspensions && (
              <div className="sm:hidden border-t border-white/[0.07] bg-[#0D0D10] px-4 py-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllSuspensions(true)}
                  className="text-xs font-semibold text-[#D4AF37] hover:underline py-1 cursor-pointer touch-manipulation"
                >
                  Mostrar {suspendedPlayers.length - 3} sanción(es) más
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center sm:justify-between gap-2.5 sm:gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 min-w-0">
          <label htmlFor="discipline-team-filter" className="text-xs text-zinc-400 shrink-0">
            Filtrar por club:
          </label>
          <FlatSelect
            id="discipline-team-filter"
            ariaLabel="Filtrar por club"
            value={teamFilter}
            onChange={setTeamFilter}
            options={teamOptions}
            size="sm"
            className="w-full sm:w-[240px]"
            triggerBgClassName="bg-[#111114]"
          />
        </div>

        <button
          type="button"
          onClick={() => setOnlySuspended((v) => !v)}
          className={`w-full sm:w-auto min-h-[42px] sm:min-h-[38px] px-4 py-2 sm:py-1.5 rounded-lg sm:rounded-md border text-xs font-semibold transition-colors cursor-pointer touch-manipulation ${
            onlySuspended
              ? 'border-rose-400/60 bg-rose-950/30 text-rose-200'
              : 'border-white/[0.12] bg-[#111114] text-zinc-300 hover:border-white/25'
          }`}
        >
          {onlySuspended ? 'Mostrando solo suspendidos' : 'Mostrar solo suspendidos'}
        </button>
      </div>

      {/* Discipline Registry: Mobile Card List + Desktop Table */}
      <div className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 sm:p-10 text-center text-sm text-zinc-400">
            No hay tarjetas ni sanciones registradas con el filtro actual.
          </div>
        ) : (
          <>
            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-white/[0.06]">
              {filtered.map((row) => (
                <button
                  key={row.playerId}
                  type="button"
                  onClick={() => onSelectPlayer(row.playerId)}
                  className="w-full px-4 py-3.5 text-left hover:bg-white/[0.025] transition-colors flex items-start justify-between gap-3 cursor-pointer touch-manipulation"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-[#F5F5F4] leading-snug">
                      #{row.dorsal} {row.playerName}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-400 leading-snug">
                      {row.teamName}
                    </div>
                    {row.yellowCards > 0 && (
                      <div className="mt-1 text-[11px] text-zinc-500">
                        Ciclo amarillas: {row.yellowCycleCount}/{rules.yellowAccumulationLimit}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-3 font-mono-num text-xs">
                      <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                        <span className="inline-block w-2 h-3 rounded-[2px] bg-amber-400" aria-hidden="true" />
                        {row.yellowCards}
                      </span>
                      <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                        <span className="inline-block w-2 h-3 rounded-[2px] bg-rose-500" aria-hidden="true" />
                        {row.redCards}
                      </span>
                    </div>
                    <div className="text-xs">
                      {row.isSuspended ? (
                        <span className="font-semibold text-rose-400 whitespace-nowrap">
                          Suspendido · {row.pendingMatches} p.
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium whitespace-nowrap">
                          Habilitado
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.08] bg-[#0D0D10] text-xs text-zinc-400">
                  <tr>
                    <th className="py-3 pl-5 pr-2 font-medium">Jugador</th>
                    <th className="py-3 px-2 font-medium">Club</th>
                    <th className="py-3 px-2 text-center font-medium">Amarillas</th>
                    <th className="py-3 px-2 text-center font-medium">Rojas</th>
                    <th className="py-3 pl-2 pr-5 text-right font-medium">Estado oficial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filtered.map((row) => (
                    <tr key={row.playerId} className="hover:bg-white/[0.025] transition-colors">
                      <td className="py-3.5 pl-5 pr-2">
                        <button
                          type="button"
                          onClick={() => onSelectPlayer(row.playerId)}
                          className="font-semibold text-[#F5F5F4] hover:text-[#D4AF37] transition-colors text-left cursor-pointer"
                        >
                          #{row.dorsal} {row.playerName}
                        </button>
                      </td>
                      <td className="py-3.5 px-2 text-xs text-zinc-300">{row.teamName}</td>
                      <td className="py-3.5 px-2 text-center font-mono-num">
                        <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold">
                          <span className="inline-block w-2.5 h-3.5 rounded-[2px] bg-amber-400" aria-hidden="true" />
                          {row.yellowCards}
                        </span>
                        {row.yellowCards > 0 && (
                          <span className="block text-[11px] text-zinc-400">
                            Ciclo: {row.yellowCycleCount}/{rules.yellowAccumulationLimit}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-center font-mono-num">
                        <span className="inline-flex items-center gap-1.5 text-rose-400 font-semibold">
                          <span className="inline-block w-2.5 h-3.5 rounded-[2px] bg-rose-500" aria-hidden="true" />
                          {row.redCards}
                        </span>
                      </td>
                      <td className="py-3.5 pl-2 pr-5 text-right text-xs">
                        {row.isSuspended ? (
                          <span className="font-semibold text-rose-400">
                            Suspendido · {row.pendingMatches} p.
                          </span>
                        ) : (
                          <span className="text-emerald-400">Habilitado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Public Special Annotations */}
      {publicNotesList.length > 0 && (
        <section className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-hidden">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#F5F5F4] px-4 sm:px-5 py-3.5 border-b border-white/[0.08]">
            <FileText className="w-4 h-4 text-[#D4AF37]" />
            <span>Anotaciones especiales públicas</span>
          </div>
          <ul className="divide-y divide-white/[0.06] px-4 sm:px-5">
            {publicNotesList.map((item) => (
              <li key={item.id} className="py-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="font-semibold text-[#F5F5F4]">{item.playerName}</span>{' '}
                  <span className="text-zinc-400">({item.teamName})</span>
                  <p className="mt-1 text-zinc-300">{item.note}</p>
                </div>
                <span className="text-zinc-400 shrink-0">Resolución pública</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
