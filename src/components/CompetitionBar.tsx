import { LogOut } from 'lucide-react';
import type { Competition, PublicUser } from '../types/league';
import { FlatSelect } from './FlatSelect';

interface CompetitionBarProps {
  competitions: Competition[];
  activeCompetition: Competition;
  onSelectCompetition: (competitionId: string) => void;
  user: PublicUser | null;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export function CompetitionBar({
  competitions,
  activeCompetition,
  onSelectCompetition,
  user,
  onLogout,
  onOpenAuth,
}: CompetitionBarProps) {
  const options = competitions.map((comp) => ({
    value: comp.id,
    label: comp.name,
    meta: comp.season,
    statusLabel:
      comp.status === 'archived'
        ? comp.championTeamName
          ? `Archivo · Campeón: ${comp.championTeamName}`
          : 'Archivo'
        : 'Activa',
    statusTone: (comp.status === 'archived' ? 'amber' : 'emerald') as 'amber' | 'emerald',
  }));

  const statusSummary =
    activeCompetition.status === 'archived'
      ? `Temporada cerrada${activeCompetition.championTeamName ? ` · Campeón: ${activeCompetition.championTeamName}` : ''}`
      : 'Temporada activa';

  return (
    <div className="border-b border-white/[0.07] bg-[#101013]">
      <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-3.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-full sm:w-auto">
          <label
            htmlFor="competition-selector"
            className="hidden sm:inline text-xs font-medium text-zinc-400 shrink-0"
          >
            Torneo:
          </label>
          <FlatSelect
            id="competition-selector"
            ariaLabel="Competencia:"
            value={activeCompetition.id}
            onChange={onSelectCompetition}
            options={options}
            size="sm"
            className="flex-1 min-w-0 sm:flex-none sm:w-[270px]"
            triggerBgClassName="bg-[#0A0A0A]"
          />

          <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400">
            <span>{activeCompetition.season}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                activeCompetition.status === 'archived' ? 'text-amber-400' : 'text-emerald-400'
              }
            >
              {statusSummary}
            </span>
          </div>

          {user && (
            <button
              type="button"
              onClick={onLogout}
              className="sm:hidden inline-flex items-center gap-1.5 min-h-[42px] px-3 py-1.5 rounded-lg border border-white/[0.1] bg-[#0A0A0A] text-xs text-zinc-300 hover:text-white hover:border-white/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer touch-manipulation"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          )}
        </div>

        {/* Mobile compact season status subline */}
        <div className="flex lg:hidden items-center justify-between gap-2 text-[11px] text-zinc-400 px-0.5">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span>{activeCompetition.season}</span>
            <span aria-hidden="true">·</span>
            <span
              className={`truncate ${
                activeCompetition.status === 'archived' ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {statusSummary}
            </span>
          </div>
          {user && (
            <span className="sm:hidden text-zinc-300 font-medium truncate max-w-[140px]">
              {user.name}
            </span>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs shrink-0">
          {user ? (
            <div className="flex items-center gap-2.5">
              <span className="text-zinc-300 font-medium truncate max-w-[160px]">
                {user.name}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-md border border-white/[0.1] bg-[#0A0A0A] text-zinc-300 hover:text-white hover:border-white/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="text-zinc-400 hover:text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer"
            >
              Acceso DT y Directiva
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
