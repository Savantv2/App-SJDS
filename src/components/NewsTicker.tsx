import { ArrowLeftRight, Pause, Play, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildTickerNewsItems } from '../lib/leagueEngine';
import type { PublicOverviewPayload, TickerNewsItem } from '../types/league';

interface NewsTickerProps {
  data: PublicOverviewPayload;
  onSelectMatch: (matchId: string) => void;
  onSelectPlayer: (playerId: string) => void;
}

export function NewsTicker({
  data,
  onSelectMatch,
  onSelectPlayer,
}: NewsTickerProps) {
  const [paused, setPaused] = useState(false);

  const items = useMemo(
    () =>
      buildTickerNewsItems(
        data.matches,
        data.events,
        data.teams,
        data.players,
        data.publicTransfers ?? []
      ),
    [data.matches, data.events, data.teams, data.players, data.publicTransfers]
  );

  const baseCycle: TickerNewsItem[] = useMemo(() => {
    const source: TickerNewsItem[] =
      items.length > 0
        ? items
        : [
            {
              id: 'standby-notice',
              kind: 'match_result',
              label: 'Boletín',
              headline: `${data.activeCompetition.name} · ${data.activeCompetition.season} · Sin tarjetas, transferencias ni resultados registrados aún`,
              createdAt: new Date().toISOString(),
            },
          ];

    const repeated: TickerNewsItem[] = [];
    const repeatCount = source.length >= 6 ? 1 : Math.ceil(6 / source.length);
    for (let r = 0; r < repeatCount; r++) {
      for (const item of source) {
        repeated.push({ ...item, id: `${item.id}-r${r}` });
      }
    }
    return repeated;
  }, [items, data.activeCompetition.name, data.activeCompetition.season]);

  const renderGlyph = (item: TickerNewsItem) => {
    if (item.kind === 'yellow_card') {
      return (
        <span
          className="inline-block w-2 h-2.5 rounded-[1px] bg-amber-400 shrink-0"
          aria-hidden="true"
        />
      );
    }
    if (item.kind === 'red_card') {
      return (
        <span
          className="inline-block w-2 h-2.5 rounded-[1px] bg-rose-500 shrink-0"
          aria-hidden="true"
        />
      );
    }
    if (item.kind === 'transfer') {
      return <ArrowLeftRight className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" aria-hidden="true" />;
    }
    return <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />;
  };

  const renderLabelColor = (item: TickerNewsItem) => {
    if (item.kind === 'yellow_card') return 'text-amber-400';
    if (item.kind === 'red_card') return 'text-rose-400';
    if (item.kind === 'transfer') return 'text-[#D4AF37]';
    return item.label === 'En vivo' ? 'text-emerald-400' : 'text-[#D4AF37]';
  };

  const handleItemClick = (item: TickerNewsItem) => {
    if (item.matchId) {
      onSelectMatch(item.matchId);
    } else if (item.playerId) {
      onSelectPlayer(item.playerId);
    }
  };

  const renderTrack = (copyIndex: number) =>
    baseCycle.map((item) => {
      const clickable = Boolean(item.matchId || item.playerId);
      const content = (
        <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs">
          {renderGlyph(item)}
          <span className={`font-semibold ${renderLabelColor(item)}`}>
            {item.label}:
          </span>
          <span className="text-zinc-200 font-medium">{item.headline}</span>
        </span>
      );

      return (
        <span key={`${copyIndex}-${item.id}`} className="inline-flex items-center shrink-0">
          {clickable ? (
            <button
              type="button"
              onClick={() => handleItemClick(item)}
              className="px-3.5 py-2 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              {content}
            </button>
          ) : (
            <span className="px-3.5 py-2">{content}</span>
          )}
          <span className="text-zinc-600 select-none" aria-hidden="true">
            /
          </span>
        </span>
      );
    });

  return (
    <div
      aria-label="Noticias de eventos actuales"
      className="marquee-container relative flex items-stretch overflow-hidden rounded-lg border border-white/[0.08] bg-[#111114]"
    >
      <div className="flex items-center border-r border-white/[0.08] bg-[#16161B] px-3.5 py-2 shrink-0">
        <span className="text-xs font-semibold tracking-wide text-[#D4AF37] whitespace-nowrap">
          Noticias
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden flex items-center min-h-[40px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-5 bg-gradient-to-r from-[#111114] to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-5 bg-gradient-to-l from-[#111114] to-transparent"
        />

        <div
          className={`animate-sjds-marquee ${
            baseCycle.length > 12 ? 'marquee-lg' : baseCycle.length > 6 ? 'marquee-md' : ''
          } ${paused ? 'is-paused' : ''}`}
        >
          <div className="flex items-center">{renderTrack(0)}</div>
          <div className="flex items-center" aria-hidden="true">
            {renderTrack(1)}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? 'Reanudar noticias' : 'Pausar noticias'}
        title={paused ? 'Reanudar noticias' : 'Pausar noticias'}
        className="min-h-[40px] min-w-[40px] flex items-center justify-center border-l border-white/[0.08] bg-[#111114] text-zinc-400 hover:text-[#D4AF37] transition-colors shrink-0 cursor-pointer"
      >
        {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
