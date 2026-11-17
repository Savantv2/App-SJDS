import { Info, Trophy } from 'lucide-react';
import { useState } from 'react';
import type { CompetitionRules, PointAdjustment, ScorerRow, StandingsRow } from '../types/league';
import { TeamCrest } from './TeamCrest';

interface TablesViewProps {
  standings: StandingsRow[];
  scorers: ScorerRow[];
  pointAdjustments: PointAdjustment[];
  rules: CompetitionRules;
  onSelectTeam: (teamId: string) => void;
  onSelectPlayer: (playerId: string) => void;
}

export function TablesView({
  standings,
  scorers,
  pointAdjustments,
  rules,
  onSelectTeam,
  onSelectPlayer,
}: TablesViewProps) {
  const [activeTab, setActiveTab] = useState<'posiciones' | 'goleadores'>('posiciones');
  const [mobileFullTable, setMobileFullTable] = useState(false);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-[#F5F5F4]">
            Tablas Oficiales
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Victoria {rules.pointsWin} pts · Empate {rules.pointsDraw} pt · Desempate automático:
            Puntos, Diferencia de Goles y Goles a Favor.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#111114] p-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('posiciones')}
            className={`min-h-[40px] sm:min-h-[38px] px-4 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer touch-manipulation ${
              activeTab === 'posiciones'
                ? 'bg-[#D4AF37] text-[#0A0A0A]'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Posiciones
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('goleadores')}
            className={`min-h-[40px] sm:min-h-[38px] px-4 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer touch-manipulation ${
              activeTab === 'goleadores'
                ? 'bg-[#D4AF37] text-[#0A0A0A]'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Goleadores ({scorers.length})
          </button>
        </div>
      </div>

      {activeTab === 'posiciones' ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-hidden">
            {/* Mobile Compact/Full Switcher */}
            <div className="md:hidden flex items-center justify-between gap-2 border-b border-white/[0.08] bg-[#0D0D10] px-3.5 py-2 text-[11px]">
              <span className="text-zinc-400">
                {mobileFullTable ? 'Vista completa (desliza)' : 'Vista móvil adaptada'}
              </span>
              <button
                type="button"
                onClick={() => setMobileFullTable((v) => !v)}
                className="font-semibold text-[#D4AF37] hover:text-[#E5C453] py-1 px-2 rounded border border-white/[0.1] bg-[#141418] cursor-pointer touch-manipulation"
              >
                {mobileFullTable ? 'Vista compacta' : 'Ver PG / PE / PP / GF'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-white/[0.08] bg-[#0D0D10] text-[11px] sm:text-xs text-zinc-400">
                  <tr>
                    <th className="py-2.5 sm:py-3 pl-3 sm:pl-5 pr-1.5 sm:pr-2 font-medium w-8">Pos</th>
                    <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 font-medium">Equipo</th>
                    <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-right font-medium">PJ</th>
                    <th
                      className={`py-2.5 sm:py-3 px-1.5 sm:px-2 text-right font-medium ${
                        mobileFullTable ? 'table-cell' : 'hidden md:table-cell'
                      }`}
                    >
                      PG
                    </th>
                    <th
                      className={`py-2.5 sm:py-3 px-1.5 sm:px-2 text-right font-medium ${
                        mobileFullTable ? 'table-cell' : 'hidden md:table-cell'
                      }`}
                    >
                      PE
                    </th>
                    <th
                      className={`py-2.5 sm:py-3 px-1.5 sm:px-2 text-right font-medium ${
                        mobileFullTable ? 'table-cell' : 'hidden md:table-cell'
                      }`}
                    >
                      PP
                    </th>
                    <th
                      className={`py-2.5 sm:py-3 px-1.5 sm:px-2 text-right font-medium ${
                        mobileFullTable ? 'table-cell' : 'hidden md:table-cell'
                      }`}
                    >
                      GF
                    </th>
                    <th
                      className={`py-2.5 sm:py-3 px-1.5 sm:px-2 text-right font-medium ${
                        mobileFullTable ? 'table-cell' : 'hidden md:table-cell'
                      }`}
                    >
                      GC
                    </th>
                    <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 text-right font-medium">DIF</th>
                    <th className="py-2.5 sm:py-3 px-2 text-right font-medium hidden md:table-cell">Últimos</th>
                    <th className="py-2.5 sm:py-3 pl-1.5 pr-3 sm:pl-2 sm:pr-5 text-right font-medium text-[#D4AF37]">
                      PTS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {standings.map((row) => (
                    <tr
                      key={row.teamId}
                      data-testid={row.eliminated ? 'eliminated-standing-row' : 'standing-row'}
                      className={`transition-colors ${
                        row.eliminated
                          ? 'bg-rose-950/30 hover:bg-rose-950/45'
                          : 'hover:bg-white/[0.025]'
                      }`}
                    >
                      <td className="py-3 sm:py-3.5 pl-3 sm:pl-5 pr-1.5 sm:pr-2 font-mono-num text-xs font-semibold">
                        <span
                          className={
                            row.eliminated
                              ? 'text-rose-400'
                              : row.position === 1
                                ? 'text-[#D4AF37]'
                                : 'text-zinc-400'
                          }
                        >
                          {row.position}
                        </span>
                      </td>
                      <td className="py-3 sm:py-3.5 px-1.5 sm:px-2">
                        <button
                          type="button"
                          onClick={() => onSelectTeam(row.teamId)}
                          className={`flex items-center gap-2 sm:gap-2.5 text-left font-semibold transition-colors cursor-pointer min-w-0 ${
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
                            <span
                              className={`block sm:inline leading-snug ${
                                mobileFullTable ? 'whitespace-nowrap' : 'whitespace-normal md:whitespace-nowrap'
                              }`}
                            >
                              {row.teamName}
                            </span>
                            {(row.eliminated || row.adjustmentPts !== 0) && (
                              <span className="flex flex-wrap items-center gap-x-1.5 sm:inline sm:ml-1.5">
                                {row.eliminated && (
                                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-400 whitespace-nowrap">
                                    · Eliminado
                                  </span>
                                )}
                                {row.adjustmentPts !== 0 && (
                                  <span className="text-[10px] sm:text-[11px] font-mono-num text-amber-400 whitespace-nowrap">
                                    ({row.adjustmentPts > 0 ? `+${row.adjustmentPts}` : row.adjustmentPts} aj.)
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </button>
                      </td>
                      <td
                        className={`py-3 sm:py-3.5 px-1.5 sm:px-2 text-right font-mono-num ${
                          row.eliminated ? 'text-rose-200/80' : 'text-zinc-200'
                        }`}
                      >
                        {row.pj}
                      </td>
                      <td
                        className={`py-3 sm:py-3.5 px-1.5 sm:px-2 text-right font-mono-num ${
                          mobileFullTable ? 'table-cell' : 'hidden md:table-cell'
                        } ${row.eliminated ? 'text-rose-200/80' : 'text-zinc-300'}`}
                      >
                        {row.pg}
                      </td>
                      <td
                        className={`py-3 sm:py-3.5 px-1.5 sm:px-2 text-right font-mono-num ${
                          mobileFullTable ? 'table-cell' : 'hidden md:table-cell'
                        } ${row.eliminated ? 'text-rose-200/80' : 'text-zinc-300'}`}
                      >
                        {row.pe}
                      </td>
                      <td
                        className={`py-3 sm:py-3.5 px-1.5 sm:px-2 text-right font-mono-num ${
                          mobileFullTable ? 'table-cell' : 'hidden md:table-cell'
                        } ${row.eliminated ? 'text-rose-200/80' : 'text-zinc-300'}`}
                      >
                        {row.pp}
                      </td>
                      <td
                        className={`py-3 sm:py-3.5 px-1.5 sm:px-2 text-right font-mono-num ${
                          mobileFullTable ? 'table-cell' : 'hidden md:table-cell'
                        } ${row.eliminated ? 'text-rose-200/80' : 'text-zinc-300'}`}
                      >
                        {row.gf}
                      </td>
                      <td
                        className={`py-3 sm:py-3.5 px-1.5 sm:px-2 text-right font-mono-num ${
                          mobileFullTable ? 'table-cell' : 'hidden md:table-cell'
                        } ${row.eliminated ? 'text-rose-200/80' : 'text-zinc-300'}`}
                      >
                        {row.gc}
                      </td>
                      <td
                        className={`py-3 sm:py-3.5 px-1.5 sm:px-2 text-right font-mono-num ${
                          row.eliminated ? 'text-rose-200/80' : 'text-zinc-200'
                        }`}
                      >
                        {row.dif > 0 ? `+${row.dif}` : row.dif}
                      </td>
                      <td className="py-3.5 px-2 text-right hidden md:table-cell">
                        <div className="inline-flex items-center gap-1 font-mono-num text-[11px]">
                          {row.form.length === 0 ? (
                            <span className="text-zinc-500">—</span>
                          ) : (
                            row.form.map((f, idx) => (
                              <span
                                key={idx}
                                className={`w-5 h-5 rounded-sm flex items-center justify-center font-bold ${
                                  f === 'G'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : f === 'E'
                                      ? 'bg-zinc-700/60 text-zinc-200'
                                      : 'bg-rose-500/20 text-rose-300'
                                }`}
                              >
                                {f}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td
                        className={`py-3 sm:py-3.5 pl-1.5 pr-3 sm:pl-2 sm:pr-5 text-right font-mono-num text-sm sm:text-base font-bold ${
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

          {pointAdjustments.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Info className="w-4 h-4 shrink-0" />
                <span>Ajustes excepcionales oficiales registrados en esta tabla</span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-300">
                {pointAdjustments.map((adj) => {
                  const row = standings.find((s) => s.teamId === adj.teamId);
                  return (
                    <li key={adj.id}>
                      <strong className="text-[#F5F5F4]">{row?.teamName ?? adj.teamId}:</strong>{' '}
                      <span className="font-mono-num text-amber-300">
                        {adj.deltaPoints > 0 ? `+${adj.deltaPoints}` : adj.deltaPoints} pts
                      </span>{' '}
                      — {adj.reason}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-hidden">
          {scorers.length === 0 ? (
            <div className="p-8 sm:p-10 text-center text-sm text-zinc-400">
              Aún no se han registrado goles en los partidos de esta competencia.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-white/[0.08] bg-[#0D0D10] text-[11px] sm:text-xs text-zinc-400">
                  <tr>
                    <th className="py-2.5 sm:py-3 pl-3.5 sm:pl-5 pr-1.5 sm:pr-2 font-medium w-9">Pos</th>
                    <th className="py-2.5 sm:py-3 px-1.5 sm:px-2 font-medium">Jugador</th>
                    <th className="py-2.5 sm:py-3 px-2 font-medium hidden sm:table-cell">Club</th>
                    <th className="py-2.5 sm:py-3 px-2 text-right font-medium hidden sm:table-cell">PJ Equipo</th>
                    <th className="py-2.5 sm:py-3 pl-1.5 pr-3.5 sm:pl-2 sm:pr-5 text-right font-medium text-[#D4AF37]">
                      Goles
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {scorers.map((scorer) => (
                    <tr key={scorer.playerId} className="hover:bg-white/[0.025] transition-colors">
                      <td className="py-3 sm:py-3.5 pl-3.5 sm:pl-5 pr-1.5 sm:pr-2 font-mono-num text-xs font-semibold align-top sm:align-middle">
                        {scorer.position === 1 ? (
                          <span className="inline-flex items-center gap-1 text-[#D4AF37]">
                            <Trophy className="w-3.5 h-3.5" />1
                          </span>
                        ) : (
                          <span className="text-zinc-400">{scorer.position}</span>
                        )}
                      </td>
                      <td className="py-3 sm:py-3.5 px-1.5 sm:px-2">
                        <button
                          type="button"
                          onClick={() => onSelectPlayer(scorer.playerId)}
                          className="text-left font-semibold text-[#F5F5F4] hover:text-[#D4AF37] transition-colors cursor-pointer"
                        >
                          <span>
                            #{scorer.dorsal} {scorer.playerName}
                          </span>
                          {scorer.playerStatus === 'archived' && (
                            <span className="ml-1.5 text-xs font-normal text-zinc-400">
                              (Archivado)
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectTeam(scorer.teamId)}
                          className="sm:hidden mt-1 flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-[#D4AF37] text-left cursor-pointer"
                        >
                          <TeamCrest
                            name={scorer.teamName}
                            shortName={scorer.teamShortName}
                            primaryColor={scorer.teamPrimaryColor}
                            secondaryColor={scorer.teamSecondaryColor}
                            motif={scorer.teamMotif}
                            logoUrl={scorer.teamLogoUrl}
                            size="xs"
                          />
                          <span className="leading-snug">{scorer.teamName}</span>
                          <span className="text-zinc-500">· {scorer.matchesPlayed} PJ</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-2 hidden sm:table-cell">
                        <button
                          type="button"
                          onClick={() => onSelectTeam(scorer.teamId)}
                          className="inline-flex items-center gap-2 text-zinc-300 hover:text-[#D4AF37] transition-colors cursor-pointer"
                        >
                          <TeamCrest
                            name={scorer.teamName}
                            shortName={scorer.teamShortName}
                            primaryColor={scorer.teamPrimaryColor}
                            secondaryColor={scorer.teamSecondaryColor}
                            motif={scorer.teamMotif}
                            logoUrl={scorer.teamLogoUrl}
                            size="xs"
                          />
                          <span className="whitespace-nowrap">{scorer.teamName}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono-num text-zinc-300 hidden sm:table-cell">
                        {scorer.matchesPlayed}
                      </td>
                      <td className="py-3 sm:py-3.5 pl-1.5 pr-3.5 sm:pl-2 sm:pr-5 text-right font-mono-num text-base font-bold text-[#D4AF37]">
                        {scorer.goals}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
