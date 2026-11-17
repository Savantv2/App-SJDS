import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Clock,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  addMatchEventRequest,
  addPlayerRequest,
  createCompetitionRequest,
  createMatchRequest,
  createPointAdjustmentRequest,
  createTeamRequest,
  deleteMatchEventRequest,
  overrideDisciplineRequest,
  resetDemoDataRequest,
  updateCompetitionRequest,
  updateMatchRequest,
} from '../lib/api';
import { formatDateTimeFull, formatMatchDate, getMatchStatusLabel } from '../lib/format';
import { computeLiveMatchClock } from '../lib/leagueEngine';
import type {
  EventType,
  MatchStatus,
  PositionCode,
  PublicOverviewPayload,
} from '../types/league';
import { FlatSelect } from './FlatSelect';

interface AdminPanelViewProps {
  data: PublicOverviewPayload;
  onRefresh: (competitionId?: string) => Promise<void>;
}

type AdminTab = 'partidos' | 'auditoria' | 'equipos' | 'torneos';

export function AdminPanelView({ data, onRefresh }: AdminPanelViewProps) {
  const [tab, setTab] = useState<AdminTab>('partidos');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Match scheduling state
  const [jornada, setJornada] = useState('2');
  const [homeTeamId, setHomeTeamId] = useState(data.teams[0]?.id ?? '');
  const [awayTeamId, setAwayTeamId] = useState(data.teams[1]?.id ?? '');
  const [kickoffAt, setKickoffAt] = useState('2026-12-08T16:00');
  const [venue, setVenue] = useState('Estadio Municipal SJDS');

  // Selected match for Acta editing
  const [matchStatusFilter, setMatchStatusFilter] = useState<MatchStatus>('en_juego');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [eventTeamId, setEventTeamId] = useState<string>('');
  const [eventPlayerId, setEventPlayerId] = useState<string>('');
  const [eventType, setEventType] = useState<EventType>('goal');
  const [eventMinute, setEventMinute] = useState('45');
  const [eventNote, setEventNote] = useState('');
  const [eventVisibility, setEventVisibility] = useState<'public' | 'internal'>('public');

  // Point adjustment state
  const [adjTeamId, setAdjTeamId] = useState(data.teams[0]?.id ?? '');
  const [adjDelta, setAdjDelta] = useState('-1');
  const [adjReason, setAdjReason] = useState('');

  // Discipline override state
  const [discPlayerId, setDiscPlayerId] = useState(data.discipline[0]?.playerId ?? '');
  const [discMatches, setDiscMatches] = useState('0');
  const [discNote, setDiscNote] = useState('');

  // New team state
  const [teamName, setTeamName] = useState('');
  const [teamShort, setTeamShort] = useState('');
  const [teamDt, setTeamDt] = useState('');
  const [teamNeighborhood, setTeamNeighborhood] = useState('');
  const [teamColor, setTeamColor] = useState('#D4AF37');

  // Quick player add (Admin)
  const [adminPlayerTeamId, setAdminPlayerTeamId] = useState(data.teams[0]?.id ?? '');
  const [adminPlayerName, setAdminPlayerName] = useState('');
  const [adminPlayerDorsal, setAdminPlayerDorsal] = useState('');
  const [adminPlayerPos, setAdminPlayerPos] = useState<PositionCode>('MED');

  // Competition rules state
  const [yellowLimit, setYellowLimit] = useState(
    String(data.activeCompetition.rules.yellowAccumulationLimit)
  );
  const [redMatches, setRedMatches] = useState(
    String(data.activeCompetition.rules.redCardSuspensionMatches)
  );
  const [regOpen, setRegOpen] = useState(data.activeCompetition.rules.registrationOpen);
  const [regDeadline, setRegDeadline] = useState(data.activeCompetition.rules.registrationDeadline);

  // New competition state
  const [newCompName, setNewCompName] = useState('');
  const [newCompSeason, setNewCompSeason] = useState('2027');
  const [newCompCategory, setNewCompCategory] = useState('Primera División');

  useEffect(() => {
    setHomeTeamId(data.teams[0]?.id ?? '');
    setAwayTeamId(data.teams[1]?.id ?? '');
    setMatchStatusFilter('en_juego');
    setSelectedMatchId('');
    setAdjTeamId(data.teams[0]?.id ?? '');
    setAdminPlayerTeamId(data.teams[0]?.id ?? '');
    setDiscPlayerId(data.discipline[0]?.playerId ?? '');
    setYellowLimit(String(data.activeCompetition.rules.yellowAccumulationLimit));
    setRedMatches(String(data.activeCompetition.rules.redCardSuspensionMatches));
    setRegOpen(data.activeCompetition.rules.registrationOpen);
    setRegDeadline(data.activeCompetition.rules.registrationDeadline);
  }, [data.activeCompetition.id]);

  const filteredMatches = data.matches.filter((m) => m.status === matchStatusFilter);
  const selectedMatch =
    filteredMatches.find((m) => m.id === selectedMatchId) ?? filteredMatches[0];

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (selectedMatch?.status !== 'en_juego' || selectedMatch?.liveClockPaused) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [
    selectedMatch?.id,
    selectedMatch?.status,
    selectedMatch?.liveStartedAt,
    selectedMatch?.liveClockPaused,
    selectedMatch?.liveElapsedSeconds,
  ]);

  const selectedLiveClock = selectedMatch
    ? computeLiveMatchClock(selectedMatch, nowMs)
    : null;
  const matchTeams = selectedMatch
    ? data.teams.filter(
        (t) => t.id === selectedMatch.homeTeamId || t.id === selectedMatch.awayTeamId
      )
    : [];
  const effectiveEventTeamId =
    eventTeamId && matchTeams.some((t) => t.id === eventTeamId)
      ? eventTeamId
      : matchTeams[0]?.id ?? '';
  const teamRosterForEvent = data.players.filter(
    (p) => p.teamId === effectiveEventTeamId && p.status === 'active'
  );
  const effectiveEventPlayerId =
    eventPlayerId && teamRosterForEvent.some((p) => p.id === eventPlayerId)
      ? eventPlayerId
      : teamRosterForEvent[0]?.id ?? '';

  const matchEvents = selectedMatch
    ? data.events
        .filter((e) => e.matchId === selectedMatch.id)
        .slice()
        .sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
    : [];

  const runAction = async (
    fn: () => Promise<unknown>,
    successMessage: string,
    nextCompId?: string
  ) => {
    setFeedback(null);
    setBusy(true);
    try {
      await fn();
      await onRefresh(nextCompId);
      setFeedback({ type: 'ok', text: successMessage });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Ocurrió un error al guardar.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleScheduleMatch = (e: FormEvent) => {
    e.preventDefault();
    void runAction(
      () =>
        createMatchRequest({
          competitionId: data.activeCompetition.id,
          jornada: Number(jornada),
          homeTeamId,
          awayTeamId,
          kickoffAt: new Date(kickoffAt).toISOString(),
          venue,
        }),
      'Partido programado en el calendario oficial.'
    );
  };

  const handleAddEvent = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    void runAction(async () => {
      await addMatchEventRequest(selectedMatch.id, {
        teamId: effectiveEventTeamId,
        playerId: eventType === 'special_note' && !effectiveEventPlayerId ? undefined : effectiveEventPlayerId,
        type: eventType,
        minute: eventMinute ? Number(eventMinute) : undefined,
        note: eventNote || undefined,
        visibility: eventVisibility,
      });
      setEventNote('');
    }, 'Evento registrado en el acta oficial. Marcador y tablas recalculados.');
  };

  const handlePointAdjustment = (e: FormEvent) => {
    e.preventDefault();
    void runAction(async () => {
      await createPointAdjustmentRequest({
        competitionId: data.activeCompetition.id,
        teamId: adjTeamId,
        deltaPoints: Number(adjDelta),
        reason: adjReason,
      });
      setAdjReason('');
    }, 'Ajuste excepcional aplicado y registrado en auditoría.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D4AF37]">
            <Shield className="w-3.5 h-3.5" />
            <span>Panel de Administración Oficial</span>
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-[#F5F5F4]">
            Gestión de {data.activeCompetition.name}
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1 rounded-lg border border-white/[0.08] bg-[#111114] p-1 w-full lg:w-auto">
          {(
            [
              { id: 'partidos', label: 'Partidos y Actas', icon: ClipboardList },
              { id: 'auditoria', label: 'Puntos y Auditoría', icon: CheckCircle2 },
              { id: 'equipos', label: 'Clubes y Planteles', icon: Users },
              { id: 'torneos', label: 'Torneos y Reglas', icon: Trophy },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`min-h-[40px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer touch-manipulation ${
                  tab === item.id
                    ? 'bg-[#D4AF37] text-[#0A0A0A]'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border-rose-500/40 bg-rose-950/30 text-rose-200'
              : 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* TAB 1: PARTIDOS Y ACTAS */}
      {tab === 'partidos' && (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left: Match Selector & Acta Event Logger */}
          <div className="lg:col-span-7 space-y-6">
            <section className="rounded-lg border border-white/[0.08] bg-[#111114] p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-wide text-[#F5F5F4]">
                    Eventos del juego
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Inicia o suspende encuentros y registra goles, tarjetas o incidencias al instante.
                  </p>
                </div>
              </div>

              {/* Status Filter Tabs (Default: En juego) */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 border-t border-white/[0.08] pt-3">
                {(['en_juego', 'programado', 'finalizado', 'suspendido'] as MatchStatus[]).map(
                  (st) => {
                    const count = data.matches.filter((m) => m.status === st).length;
                    const isActive = matchStatusFilter === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setMatchStatusFilter(st);
                          const firstOfStatus = data.matches.find((m) => m.status === st);
                          setSelectedMatchId(firstOfStatus?.id ?? '');
                          setEventTeamId('');
                          setEventPlayerId('');
                        }}
                        className={`min-h-[38px] sm:min-h-[36px] px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer touch-manipulation ${
                          isActive
                            ? 'border-[#D4AF37] bg-[#D4AF37] text-[#0A0A0A]'
                            : 'border-white/[0.1] bg-[#0D0D10] text-zinc-300 hover:border-white/25'
                        }`}
                      >
                        {getMatchStatusLabel(st)} ({count})
                      </button>
                    );
                  }
                )}
              </div>

              {filteredMatches.length === 0 ? (
                <div className="rounded-lg border border-white/[0.08] bg-[#0D0D10] p-6 text-center space-y-3">
                  <p className="text-sm font-medium text-[#F5F5F4]">
                    No hay encuentros en estado &ldquo;{getMatchStatusLabel(matchStatusFilter)}&rdquo; en este momento.
                  </p>
                  {matchStatusFilter === 'en_juego' &&
                    data.matches.some((m) => m.status === 'programado') && (
                      <button
                        type="button"
                        onClick={() => {
                          setMatchStatusFilter('programado');
                          const firstProg = data.matches.find((m) => m.status === 'programado');
                          setSelectedMatchId(firstProg?.id ?? '');
                        }}
                        className="min-h-[38px] inline-flex items-center gap-2 rounded-md bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#0A0A0A] hover:bg-[#E5C453] transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Ir a Programados para iniciar partido</span>
                      </button>
                    )}
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="admin-select-match" className="block text-xs text-zinc-400 mb-1.5">
                      Encuentro ({getMatchStatusLabel(matchStatusFilter)})
                    </label>
                    <FlatSelect
                      id="admin-select-match"
                      ariaLabel={`Encuentro (${getMatchStatusLabel(matchStatusFilter)})`}
                      value={selectedMatch?.id ?? ''}
                      onChange={(val) => {
                        setSelectedMatchId(val);
                        setEventTeamId('');
                        setEventPlayerId('');
                      }}
                      options={filteredMatches.map((m) => {
                        const h = data.teams.find((t) => t.id === m.homeTeamId);
                        const a = data.teams.find((t) => t.id === m.awayTeamId);
                        return {
                          value: m.id,
                          label: `J${m.jornada} · ${h?.shortName ?? '?'} ${m.homeScore}-${m.awayScore} ${a?.shortName ?? '?'}`,
                          meta: getMatchStatusLabel(m.status, m.liveMinute),
                        };
                      })}
                      menuClassName="w-full"
                    />
                  </div>

                  {selectedMatch && (
                    <>
                      {/* Simple Match Summary + Direct Start / Suspend / Finish Actions */}
                      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-[#F5F5F4]">
                            {data.teams.find((t) => t.id === selectedMatch.homeTeamId)?.name ?? 'Local'}{' '}
                            <span className="font-mono-num text-[#D4AF37] mx-1.5">
                              {selectedMatch.homeScore} - {selectedMatch.awayScore}
                            </span>{' '}
                            {data.teams.find((t) => t.id === selectedMatch.awayTeamId)?.name ?? 'Visitante'}
                          </div>
                          {selectedLiveClock ? (
                            <span
                              className={`inline-flex items-center gap-1.5 font-mono-num text-xs font-bold ${
                                selectedLiveClock.isPaused ? 'text-amber-300' : 'text-[#D4AF37]'
                              }`}
                            >
                              {selectedLiveClock.isPaused ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {selectedLiveClock.formattedClock} · Min {selectedLiveClock.minute}&apos;
                                {selectedLiveClock.isPaused ? ' · En pausa' : ''}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400">
                              {getMatchStatusLabel(selectedMatch.status)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {(selectedMatch.status === 'programado' ||
                            selectedMatch.status === 'suspendido') && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void runAction(
                                  async () => {
                                    await updateMatchRequest(selectedMatch.id, {
                                      status: 'en_juego',
                                      liveMinute: selectedMatch.liveMinute ?? 1,
                                    });
                                    setMatchStatusFilter('en_juego');
                                    setSelectedMatchId(selectedMatch.id);
                                  },
                                  'Partido iniciado en vivo. El contador ya está activo en Inicio.'
                                )
                              }
                              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#0A0A0A] hover:bg-[#E5C453] disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Iniciar partido</span>
                            </button>
                          )}

                          {selectedMatch.status === 'en_juego' &&
                            (!selectedMatch.liveClockPaused ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void runAction(
                                    async () => {
                                      await updateMatchRequest(selectedMatch.id, {
                                        clockAction: 'pause',
                                      });
                                    },
                                    'Cronómetro del partido pausado.'
                                  )
                                }
                                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/25 disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                <Pause className="w-3.5 h-3.5" />
                                <span>Pausar tiempo</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void runAction(
                                    async () => {
                                      await updateMatchRequest(selectedMatch.id, {
                                        clockAction: 'resume',
                                      });
                                    },
                                    'Cronómetro del partido reanudado.'
                                  )
                                }
                                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#0A0A0A] hover:bg-[#E5C453] disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Reanudar tiempo</span>
                              </button>
                            ))}

                          {(selectedMatch.status === 'programado' ||
                            selectedMatch.status === 'en_juego') && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void runAction(
                                  async () => {
                                    await updateMatchRequest(selectedMatch.id, {
                                      status: 'suspendido',
                                    });
                                    setMatchStatusFilter('suspendido');
                                    setSelectedMatchId(selectedMatch.id);
                                  },
                                  'Partido suspendido oficialmente.'
                                )
                              }
                              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/20 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/40 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Suspender partido</span>
                            </button>
                          )}

                          {(selectedMatch.status === 'en_juego' ||
                            selectedMatch.status === 'programado') && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void runAction(
                                  async () => {
                                    await updateMatchRequest(selectedMatch.id, {
                                      status: 'finalizado',
                                    });
                                    setMatchStatusFilter('finalizado');
                                    setSelectedMatchId(selectedMatch.id);
                                  },
                                  'Partido finalizado. Tabla de posiciones actualizada.'
                                )
                              }
                              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/20 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Finalizar partido</span>
                            </button>
                          )}

                          {(selectedMatch.status === 'finalizado' ||
                            selectedMatch.status === 'suspendido') && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void runAction(
                                  async () => {
                                    await updateMatchRequest(selectedMatch.id, {
                                      status: 'programado',
                                    });
                                    setMatchStatusFilter('programado');
                                    setSelectedMatchId(selectedMatch.id);
                                  },
                                  'Partido devuelto a estado Programado.'
                                )
                              }
                              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              <span>Volver a Programado</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Add Event Form */}
                      <form onSubmit={handleAddEvent} className="grid gap-3 sm:grid-cols-12 items-end rounded-lg border border-white/[0.08] bg-[#0D0D10] p-4">
                    <div className="sm:col-span-4">
                      <label htmlFor="ev-type" className="block text-xs text-zinc-400 mb-1">
                        Tipo de evento
                      </label>
                      <FlatSelect
                        id="ev-type"
                        ariaLabel="Tipo de evento"
                        value={eventType}
                        onChange={(val) => setEventType(val as EventType)}
                        options={[
                          { value: 'goal', label: 'Gol' },
                          { value: 'yellow_card', label: 'Tarjeta amarilla' },
                          { value: 'red_card', label: 'Tarjeta roja' },
                          { value: 'special_note', label: 'Anotación especial' },
                        ]}
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label htmlFor="ev-team" className="block text-xs text-zinc-400 mb-1">
                        Equipo
                      </label>
                      <FlatSelect
                        id="ev-team"
                        ariaLabel="Equipo"
                        value={effectiveEventTeamId}
                        onChange={(val) => {
                          setEventTeamId(val);
                          setEventPlayerId('');
                        }}
                        options={matchTeams.map((t) => ({
                          value: t.id,
                          label: t.name,
                        }))}
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label htmlFor="ev-minute" className="block text-xs text-zinc-400 mb-1">
                        Minuto
                      </label>
                      <input
                        id="ev-minute"
                        type="number"
                        min={1}
                        max={120}
                        value={eventMinute}
                        onChange={(e) => setEventMinute(e.target.value)}
                        className="w-full min-h-[42px] rounded-lg border border-white/[0.12] bg-[#0D0D10] px-3 py-2 text-sm font-mono-num text-[#F5F5F4]"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="ev-player" className="block text-xs text-zinc-400 mb-1">
                        Jugador
                      </label>
                      <FlatSelect
                        id="ev-player"
                        ariaLabel="Jugador"
                        value={effectiveEventPlayerId}
                        onChange={setEventPlayerId}
                        options={teamRosterForEvent.map((p) => ({
                          value: p.id,
                          label: `#${p.dorsal} ${p.name}`,
                          meta: p.primaryPosition,
                        }))}
                        menuClassName="w-full"
                      />
                    </div>

                    {eventType === 'special_note' && (
                      <div className="sm:col-span-6">
                        <label htmlFor="ev-visibility" className="block text-xs text-zinc-400 mb-1">
                          Visibilidad
                        </label>
                        <FlatSelect
                          id="ev-visibility"
                          ariaLabel="Visibilidad"
                          value={eventVisibility}
                          onChange={(val) => setEventVisibility(val as 'public' | 'internal')}
                          options={[
                            { value: 'public', label: 'Pública (visible a afición)' },
                            { value: 'internal', label: 'Interna (solo directiva)' },
                          ]}
                        />
                      </div>
                    )}

                    <div className={eventType === 'special_note' ? 'sm:col-span-9' : 'sm:col-span-4'}>
                      <label htmlFor="ev-note" className="block text-xs text-zinc-400 mb-1">
                        Nota / Observación {eventType === 'special_note' ? '(obligatoria)' : '(opcional)'}
                      </label>
                      <input
                        id="ev-note"
                        type="text"
                        required={eventType === 'special_note'}
                        value={eventNote}
                        onChange={(e) => setEventNote(e.target.value)}
                        placeholder="Detalle arbitral o resolución"
                        className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F4]"
                      />
                    </div>

                    <div className={eventType === 'special_note' ? 'sm:col-span-3' : 'sm:col-span-2'}>
                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full min-h-[44px] rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-[#0A0A0A] hover:bg-[#E5C453] disabled:opacity-50 cursor-pointer"
                      >
                        Registrar
                      </button>
                    </div>
                  </form>

                  {/* Existing Events in Acta */}
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-semibold text-zinc-300">
                      Eventos registrados en este partido ({matchEvents.length})
                    </h3>
                    {matchEvents.length === 0 ? (
                      <p className="text-xs text-zinc-500">Sin eventos registrados aún.</p>
                    ) : (
                      <ul className="divide-y divide-white/10 rounded-xl border border-white/10 bg-[#0A0A0A]">
                        {matchEvents.map((ev) => {
                          const p = data.players.find((pl) => pl.id === ev.playerId);
                          const t = data.teams.find((tm) => tm.id === ev.teamId);
                          return (
                            <li
                              key={ev.id}
                              className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs"
                            >
                              <div className="min-w-0">
                                <span className="font-mono-num text-[#D4AF37] mr-2">
                                  {ev.minute ? `${ev.minute}'` : '—'}
                                </span>
                                <span className="font-semibold text-[#F5F5F4]">
                                  {ev.type === 'goal'
                                    ? 'Gol'
                                    : ev.type === 'yellow_card'
                                      ? 'Amarilla'
                                      : ev.type === 'red_card'
                                        ? 'Roja'
                                        : `Nota (${ev.visibility === 'internal' ? 'Interna' : 'Pública'})`}
                                </span>
                                {p && <span className="text-zinc-300"> · {p.name}</span>}
                                {t && <span className="text-zinc-500"> ({t.shortName})</span>}
                                {ev.note && <p className="text-zinc-400 mt-0.5">{ev.note}</p>}
                              </div>
                              <button
                                type="button"
                                disabled={busy}
                                aria-label={`Eliminar evento ${ev.id}`}
                                onClick={() =>
                                  void runAction(
                                    () =>
                                      deleteMatchEventRequest(
                                        ev.id,
                                        'Corrección manual desde Panel Admin'
                                      ),
                                    'Evento eliminado y marcador recalculado.'
                                  )
                                }
                                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </>
              )}
                </>
              )}
            </section>
          </div>

          {/* Right: Programar Nuevo Partido */}
          <div className="lg:col-span-5">
            <section className="rounded-lg border border-white/[0.08] bg-[#111114] p-5 space-y-4">
              <h2 className="font-display text-2xl font-bold tracking-wide text-[#F5F5F4]">
                Programar partido
              </h2>
              <form onSubmit={handleScheduleMatch} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="m-jornada" className="block text-xs text-zinc-400 mb-1">
                      Jornada
                    </label>
                    <input
                      id="m-jornada"
                      type="number"
                      min={1}
                      required
                      value={jornada}
                      onChange={(e) => setJornada(e.target.value)}
                      className="w-full min-h-[42px] rounded-lg border border-white/[0.12] bg-[#0D0D10] px-3 py-2 text-sm font-mono-num text-[#F5F5F4]"
                    />
                  </div>
                  <div>
                    <label htmlFor="m-kickoff" className="block text-xs text-zinc-400 mb-1">
                      Fecha y hora
                    </label>
                    <input
                      id="m-kickoff"
                      type="datetime-local"
                      required
                      value={kickoffAt}
                      onChange={(e) => setKickoffAt(e.target.value)}
                      className="w-full min-h-[42px] rounded-lg border border-white/[0.12] bg-[#0D0D10] px-3 py-2 text-sm text-[#F5F5F4]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="m-home" className="block text-xs text-zinc-400 mb-1">
                    Equipo local
                  </label>
                  <FlatSelect
                    id="m-home"
                    ariaLabel="Equipo local"
                    value={homeTeamId}
                    onChange={setHomeTeamId}
                    options={data.teams.map((t) => ({ value: t.id, label: t.name }))}
                    menuClassName="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="m-away" className="block text-xs text-zinc-400 mb-1">
                    Equipo visitante
                  </label>
                  <FlatSelect
                    id="m-away"
                    ariaLabel="Equipo visitante"
                    value={awayTeamId}
                    onChange={setAwayTeamId}
                    options={data.teams.map((t) => ({ value: t.id, label: t.name }))}
                    menuClassName="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="m-venue" className="block text-xs text-zinc-400 mb-1">
                    Cancha / Estadio
                  </label>
                  <input
                    id="m-venue"
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F4]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E5C453] disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar al calendario</span>
                </button>
              </form>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: PUNTOS Y AUDITORIA */}
      {tab === 'auditoria' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Point Adjustment Form */}
            <section className="rounded-lg border border-white/[0.08] bg-[#111114] p-5 space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-wide text-[#F5F5F4]">
                  Ajuste excepcional de puntos
                </h2>
                <p className="text-xs text-zinc-400">
                  El puntaje normal se calcula desde los resultados. Todo ajuste manual requiere un
                  motivo oficial visible.
                </p>
              </div>
              <form onSubmit={handlePointAdjustment} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="adj-team" className="block text-xs text-zinc-400 mb-1">
                      Club
                    </label>
                    <FlatSelect
                      id="adj-team"
                      ariaLabel="Club"
                      value={adjTeamId}
                      onChange={setAdjTeamId}
                      options={data.teams.map((t) => ({ value: t.id, label: t.name }))}
                      menuClassName="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="adj-delta" className="block text-xs text-zinc-400 mb-1">
                      Puntos (+/-)
                    </label>
                    <input
                      id="adj-delta"
                      type="number"
                      required
                      value={adjDelta}
                      onChange={(e) => setAdjDelta(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm font-mono-num text-[#F5F5F4]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="adj-reason" className="block text-xs text-zinc-400 mb-1">
                    Motivo oficial (obligatorio)
                  </label>
                  <input
                    id="adj-reason"
                    type="text"
                    required
                    minLength={5}
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                    placeholder="Ej. Resolución Comité Disciplinario #09"
                    className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F4]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[44px] rounded-lg bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E5C453] disabled:opacity-50 cursor-pointer"
                >
                  Aplicar ajuste a la tabla
                </button>
              </form>
            </section>

            {/* Discipline Validation */}
            <section className="rounded-lg border border-white/[0.08] bg-[#111114] p-5 space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-wide text-[#F5F5F4]">
                  Validación de suspensiones
                </h2>
                <p className="text-xs text-zinc-400">
                  Confirma o ajusta partidos pendientes de sanción por tarjeta roja o acumulación.
                </p>
              </div>
              {data.discipline.length === 0 ? (
                <p className="text-xs text-zinc-400">
                  No hay jugadores con tarjetas registradas en esta competencia.
                </p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void runAction(
                      () =>
                        overrideDisciplineRequest({
                          competitionId: data.activeCompetition.id,
                          playerId: discPlayerId || data.discipline[0].playerId,
                          matchesRemaining: Number(discMatches),
                          validated: true,
                          note: discNote || 'Validado por Comité Disciplinario',
                        }),
                      'Sanción disciplinaria actualizada.'
                    );
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label htmlFor="disc-player" className="block text-xs text-zinc-400 mb-1">
                        Jugador
                      </label>
                      <FlatSelect
                        id="disc-player"
                        ariaLabel="Jugador"
                        value={discPlayerId || data.discipline[0]?.playerId}
                        onChange={setDiscPlayerId}
                        options={data.discipline.map((d) => ({
                          value: d.playerId,
                          label: `${d.playerName} (${d.teamShortName})`,
                          meta: `${d.pendingMatches} p.`,
                        }))}
                        menuClassName="w-full"
                      />
                    </div>
                    <div>
                      <label htmlFor="disc-matches" className="block text-xs text-zinc-400 mb-1">
                        Partidos pend.
                      </label>
                      <input
                        id="disc-matches"
                        type="number"
                        min={0}
                        max={10}
                        value={discMatches}
                        onChange={(e) => setDiscMatches(e.target.value)}
                        className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm font-mono-num text-[#F5F5F4]"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="disc-note" className="block text-xs text-zinc-400 mb-1">
                      Resolución / Motivo
                    </label>
                    <input
                      id="disc-note"
                      type="text"
                      value={discNote}
                      onChange={(e) => setDiscNote(e.target.value)}
                      placeholder="Ej. Sanción cumplida / Ratificación de 2 fechas"
                      className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F4]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="min-h-[44px] rounded-lg border border-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 cursor-pointer"
                  >
                    Guardar resolución disciplinaria
                  </button>
                </form>
              )}
            </section>
          </div>

          {/* Audit History */}
          <section className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-hidden">
            <div className="border-b border-white/10 px-4 sm:px-5 py-4">
              <h2 className="font-display text-2xl font-bold tracking-wide text-[#F5F5F4]">
                Historial de auditoría oficial ({data.auditLogs?.length ?? 0})
              </h2>
              <p className="text-xs text-zinc-400">
                Cada corrección registra valor anterior, valor nuevo, fecha, responsable y motivo.
              </p>
            </div>
            <div className="md:hidden divide-y divide-white/10">
              {(data.auditLogs ?? []).map((log) => (
                <div key={log.id} className="p-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#F5F5F4]">{log.action}</span>
                    <span className="font-mono-num text-[11px] text-zinc-400">
                      {formatDateTimeFull(log.createdAt)}
                    </span>
                  </div>
                  <div className="text-zinc-300">
                    <span className="text-zinc-500">{log.previousValue}</span>
                    {' -> '}
                    <span className="text-[#D4AF37] font-medium">{log.newValue}</span>
                  </div>
                  <p className="text-zinc-400">{log.reason}</p>
                  <div className="text-[11px] text-zinc-500">Por: {log.actorName}</div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-[#0A0A0A] text-zinc-400">
                  <tr>
                    <th className="py-3 pl-5 pr-2 font-medium">Fecha</th>
                    <th className="py-3 px-2 font-medium">Acción</th>
                    <th className="py-3 px-2 font-medium">Anterior</th>
                    <th className="py-3 px-2 font-medium">Nuevo</th>
                    <th className="py-3 px-2 font-medium">Responsable</th>
                    <th className="py-3 pl-2 pr-5 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(data.auditLogs ?? []).map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 pl-5 pr-2 font-mono-num text-zinc-400 whitespace-nowrap">
                        {formatDateTimeFull(log.createdAt)}
                      </td>
                      <td className="py-3 px-2 font-semibold text-[#F5F5F4]">{log.action}</td>
                      <td className="py-3 px-2 text-zinc-400">{log.previousValue}</td>
                      <td className="py-3 px-2 text-[#D4AF37] font-medium">{log.newValue}</td>
                      <td className="py-3 px-2 text-zinc-300">{log.actorName}</td>
                      <td className="py-3 pl-2 pr-5 text-zinc-300">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: CLUBES Y PLANTELES */}
      {tab === 'equipos' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-white/[0.08] bg-[#111114] p-5 space-y-4">
            <h2 className="font-display text-2xl font-bold tracking-wide text-[#F5F5F4]">
              Registrar nuevo club
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runAction(async () => {
                  await createTeamRequest({
                    competitionId: data.activeCompetition.id,
                    name: teamName,
                    shortName: teamShort,
                    primaryColor: teamColor,
                    secondaryColor: '#121215',
                    dtName: teamDt,
                    neighborhood: teamNeighborhood || 'San Juan del Sur',
                  });
                  setTeamName('');
                  setTeamShort('');
                  setTeamDt('');
                  setTeamNeighborhood('');
                }, 'Club registrado en la competencia.');
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="t-name" className="block text-xs text-zinc-400 mb-1">
                    Nombre del club
                  </label>
                  <input
                    id="t-name"
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Ej. Deportivo El Ostional"
                    className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F4]"
                  />
                </div>
                <div>
                  <label htmlFor="t-short" className="block text-xs text-zinc-400 mb-1">
                    Sigla (3 letras)
                  </label>
                  <input
                    id="t-short"
                    type="text"
                    required
                    maxLength={4}
                    value={teamShort}
                    onChange={(e) => setTeamShort(e.target.value.toUpperCase())}
                    placeholder="OST"
                    className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm font-mono-num text-[#F5F5F4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="t-dt" className="block text-xs text-zinc-400 mb-1">
                    Director Técnico
                  </label>
                  <input
                    id="t-dt"
                    type="text"
                    required
                    value={teamDt}
                    onChange={(e) => setTeamDt(e.target.value)}
                    placeholder="Nombre del DT"
                    className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F4]"
                  />
                </div>
                <div>
                  <label htmlFor="t-barrio" className="block text-xs text-zinc-400 mb-1">
                    Barrio / Comunidad
                  </label>
                  <input
                    id="t-barrio"
                    type="text"
                    value={teamNeighborhood}
                    onChange={(e) => setTeamNeighborhood(e.target.value)}
                    placeholder="El Ostional"
                    className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F4]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="t-color" className="block text-xs text-zinc-400 mb-1">
                  Color representativo del escudo
                </label>
                <input
                  id="t-color"
                  type="color"
                  value={teamColor}
                  onChange={(e) => setTeamColor(e.target.value)}
                  className="h-10 w-24 rounded border border-white/15 bg-[#0A0A0A] p-1 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="min-h-[44px] rounded-lg bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E5C453] cursor-pointer"
              >
                Crear club
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-white/[0.08] bg-[#111114] p-5 space-y-4">
            <h2 className="font-display text-2xl font-bold tracking-wide text-[#F5F5F4]">
              Inscribir jugador en cualquier club
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runAction(async () => {
                  await addPlayerRequest(adminPlayerTeamId, {
                    name: adminPlayerName,
                    dorsal: Number(adminPlayerDorsal),
                    primaryPosition: adminPlayerPos,
                  });
                  setAdminPlayerName('');
                  setAdminPlayerDorsal('');
                }, 'Jugador agregado al plantel por administración.');
              }}
              className="space-y-3"
            >
              <div>
                <label htmlFor="ap-team" className="block text-xs text-zinc-400 mb-1">
                  Club destino
                </label>
                <FlatSelect
                  id="ap-team"
                  ariaLabel="Club destino"
                  value={adminPlayerTeamId}
                  onChange={setAdminPlayerTeamId}
                  options={data.teams.map((t) => ({ value: t.id, label: t.name }))}
                  menuClassName="w-full"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="ap-name" className="block text-xs text-zinc-400 mb-1">
                    Nombre completo
                  </label>
                  <input
                    id="ap-name"
                    type="text"
                    required
                    value={adminPlayerName}
                    onChange={(e) => setAdminPlayerName(e.target.value)}
                    placeholder="Nombre del jugador"
                    className="w-full min-h-[42px] rounded-lg border border-white/[0.12] bg-[#0D0D10] px-3 py-2 text-sm text-[#F5F5F4]"
                  />
                </div>
                <div>
                  <label htmlFor="ap-dorsal" className="block text-xs text-zinc-400 mb-1">
                    Dorsal
                  </label>
                  <input
                    id="ap-dorsal"
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={adminPlayerDorsal}
                    onChange={(e) => setAdminPlayerDorsal(e.target.value)}
                    placeholder="22"
                    className="w-full min-h-[42px] rounded-lg border border-white/[0.12] bg-[#0D0D10] px-3 py-2 text-sm font-mono-num text-[#F5F5F4]"
                  />
                </div>
                <div>
                  <label htmlFor="ap-pos" className="block text-xs text-zinc-400 mb-1">
                    Posición
                  </label>
                  <FlatSelect
                    id="ap-pos"
                    ariaLabel="Posición"
                    value={adminPlayerPos}
                    onChange={(val) => setAdminPlayerPos(val as PositionCode)}
                    options={[
                      { value: 'POR', label: 'POR' },
                      { value: 'DEF', label: 'DEF' },
                      { value: 'MED', label: 'MED' },
                      { value: 'DEL', label: 'DEL' },
                    ]}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="min-h-[42px] rounded-md bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E5C453] cursor-pointer"
              >
                Inscribir jugador
              </button>
            </form>
          </section>
        </div>
      )}

      {/* TAB 4: TORNEOS Y REGLAS */}
      {tab === 'torneos' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-white/[0.08] bg-[#111114] p-5 space-y-4">
            <h2 className="font-display text-2xl font-bold tracking-wide text-[#F5F5F4]">
              Reglamento de {data.activeCompetition.name}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runAction(
                  () =>
                    updateCompetitionRequest(data.activeCompetition.id, {
                      rules: {
                        yellowAccumulationLimit: Number(yellowLimit),
                        redCardSuspensionMatches: Number(redMatches),
                        registrationOpen: regOpen,
                        registrationDeadline: regDeadline,
                      },
                    }),
                  'Reglamento de competencia actualizado.'
                );
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="r-yellow" className="block text-xs text-zinc-400 mb-1">
                    Amarillas para suspensión
                  </label>
                  <input
                    id="r-yellow"
                    type="number"
                    min={1}
                    max={10}
                    value={yellowLimit}
                    onChange={(e) => setYellowLimit(e.target.value)}
                    className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm font-mono-num text-[#F5F5F4]"
                  />
                </div>
                <div>
                  <label htmlFor="r-red" className="block text-xs text-zinc-400 mb-1">
                    Partidos por roja directa
                  </label>
                  <input
                    id="r-red"
                    type="number"
                    min={1}
                    max={10}
                    value={redMatches}
                    onChange={(e) => setRedMatches(e.target.value)}
                    className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm font-mono-num text-[#F5F5F4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-end">
                <div>
                  <label htmlFor="r-deadline" className="block text-xs text-zinc-400 mb-1">
                    Fecha límite de inscripción
                  </label>
                  <input
                    id="r-deadline"
                    type="date"
                    value={regDeadline}
                    onChange={(e) => setRegDeadline(e.target.value)}
                    className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F4]"
                  />
                </div>
                <label className="flex items-center gap-2.5 min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regOpen}
                    onChange={(e) => setRegOpen(e.target.checked)}
                    className="h-4 w-4 accent-[#D4AF37]"
                  />
                  <span className="text-xs font-medium text-[#F5F5F4]">
                    Inscripción abierta a DTs
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[44px] rounded-lg bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E5C453] cursor-pointer"
                >
                  Guardar reglamento
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      () =>
                        updateCompetitionRequest(data.activeCompetition.id, {
                          status:
                            data.activeCompetition.status === 'active' ? 'archived' : 'active',
                        }),
                      'Estado de temporada actualizado.'
                    )
                  }
                  className="min-h-[44px] rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-[#D4AF37] cursor-pointer"
                >
                  {data.activeCompetition.status === 'active'
                    ? 'Cerrar y archivar temporada'
                    : 'Reabrir temporada'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-lg border border-white/[0.08] bg-[#111114] p-5 space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-wide text-[#F5F5F4]">
                Crear nueva competencia o copa
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void runAction(async () => {
                    const { competition } = await createCompetitionRequest({
                      name: newCompName,
                      season: newCompSeason,
                      category: newCompCategory,
                      yellowAccumulationLimit: 3,
                      redCardSuspensionMatches: 2,
                      registrationDeadline: '2027-03-31',
                    });
                    setNewCompName('');
                    await onRefresh(competition.id);
                  }, 'Nueva competencia creada y seleccionada.');
                }}
                className="mt-3 space-y-3"
              >
                <input
                  type="text"
                  required
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  placeholder="Nombre (Ej. Copa Verano SJDS 2027)"
                  className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F4]"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={newCompSeason}
                    onChange={(e) => setNewCompSeason(e.target.value)}
                    placeholder="Temporada"
                    className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F4]"
                  />
                  <input
                    type="text"
                    required
                    value={newCompCategory}
                    onChange={(e) => setNewCompCategory(e.target.value)}
                    placeholder="Categoría"
                    className="w-full min-h-[44px] rounded-lg border border-white/15 bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F4]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[44px] rounded-lg bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E5C453] cursor-pointer"
                >
                  Crear torneo
                </button>
              </form>
            </div>

            <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-400">
                Restaurar los datos de ejemplo iniciales para otra presentación.
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void runAction(
                    () => resetDemoDataRequest(),
                    'Base de demostración restaurada a su estado inicial.',
                    'liga-heroes-y-martires'
                  )
                }
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-[#D4AF37] hover:text-[#D4AF37] shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reiniciar demo</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
