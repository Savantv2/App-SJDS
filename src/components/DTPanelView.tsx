import {
  Archive,
  ArrowLeftRight,
  Lock,
  Plus,
  RotateCcw,
  ShieldCheck,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  addPlayerRequest,
  updatePlayerRequest,
  updateTeamLogoRequest,
  updateTeamStartersRequest,
} from '../lib/api';
import {
  getPositionLabel,
  getTeamStarters,
  MAX_STARTERS,
} from '../lib/leagueEngine';
import type {
  Competition,
  Player,
  PositionCode,
  PublicUser,
  Team,
} from '../types/league';
import { FlatSelect } from './FlatSelect';
import { TeamCrest } from './TeamCrest';
import { TransferPlayerModal } from './TransferPlayerModal';

interface DTPanelViewProps {
  user: PublicUser;
  competition: Competition;
  teams: Team[];
  players: Player[];
  onOpenAuth: () => void;
  onRefresh: () => Promise<void>;
}

const POSITIONS: PositionCode[] = ['POR', 'DEF', 'MED', 'DEL'];

export function DTPanelView({
  user,
  competition,
  teams,
  players,
  onOpenAuth,
  onRefresh,
}: DTPanelViewProps) {
  const assignedTeam = teams.find(
    (t) => t.id === user.assignedTeamId || t.dtUserId === user.id
  );

  const [newName, setNewName] = useState('');
  const [newDorsal, setNewDorsal] = useState('');
  const [newPrimaryPos, setNewPrimaryPos] = useState<PositionCode>('MED');
  const [newSecondaryPos, setNewSecondaryPos] = useState<PositionCode | ''>('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [transferPlayerId, setTransferPlayerId] = useState<string | null>(null);

  if (!assignedTeam) {
    return (
      <div className="rounded-lg border border-white/[0.08] bg-[#111114] p-8 text-center space-y-2">
        <Lock className="w-8 h-8 text-[#D4AF37] mx-auto" />
        <h1 className="font-display text-2xl font-bold text-[#F5F5F4]">
          Sin club asignado en {competition.name}
        </h1>
        <p className="text-sm text-zinc-400">
          Tu cuenta de Director Técnico no está vinculada a un equipo participante en este torneo.
          Cambia de competencia arriba o solicita asignación al Administrador.
        </p>
      </div>
    );
  }

  const teamPlayers = players
    .filter((p) => p.teamId === assignedTeam.id)
    .slice()
    .sort((a, b) => a.dorsal - b.dorsal);
  const activePlayers = teamPlayers.filter((p) => p.status === 'active');
  const archivedPlayers = teamPlayers.filter((p) => p.status === 'archived');
  const starters = getTeamStarters(assignedTeam, teamPlayers);
  const starterIdSet = new Set(starters.map((s) => s.id));
  const isLockedByLeague =
    competition.status === 'archived' || !competition.rules.registrationOpen;
  const isFull = activePlayers.length >= competition.rules.maxActivePlayers;

  const handleToggleStarter = async (player: Player) => {
    setFeedback(null);
    const isStarter = starterIdSet.has(player.id);
    if (!isStarter && starters.length >= MAX_STARTERS) {
      setFeedback({
        type: 'error',
        text: `Ya tienes ${MAX_STARTERS} titulares seleccionados. Quita a uno antes de añadir otro.`,
      });
      return;
    }

    const nextIds = isStarter
      ? starters.filter((s) => s.id !== player.id).map((s) => s.id)
      : [...starters.map((s) => s.id), player.id];

    setBusy(true);
    try {
      await updateTeamStartersRequest(assignedTeam.id, nextIds);
      setFeedback({
        type: 'ok',
        text: isStarter
          ? `${player.name} retirado de los titulares (${nextIds.length}/${MAX_STARTERS}).`
          : `${player.name} añadido a los titulares (${nextIds.length}/${MAX_STARTERS}).`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo actualizar los titulares.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleAddPlayer = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setBusy(true);
    try {
      await addPlayerRequest(assignedTeam.id, {
        name: newName,
        dorsal: Number(newDorsal),
        primaryPosition: newPrimaryPos,
        secondaryPosition: newSecondaryPos || undefined,
      });
      setNewName('');
      setNewDorsal('');
      setNewSecondaryPos('');
      setFeedback({ type: 'ok', text: 'Jugador inscrito correctamente en el plantel oficial.' });
      await onRefresh();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo agregar el jugador.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleUpdatePlayer = async (
    player: Player,
    changes: {
      dorsal?: number;
      primaryPosition?: PositionCode;
      secondaryPosition?: PositionCode | '';
      status?: 'active' | 'archived';
    }
  ) => {
    setFeedback(null);
    setBusy(true);
    try {
      await updatePlayerRequest(assignedTeam.id, player.id, changes);
      setFeedback({
        type: 'ok',
        text:
          changes.status === 'archived'
            ? `${player.name} fue dado de baja conservando sus estadísticas históricas.`
            : changes.status === 'active'
              ? `${player.name} fue reactivado en el plantel.`
              : `Ficha de ${player.name} actualizada.`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo actualizar el jugador.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setFeedback({ type: 'error', text: 'La imagen del escudo debe pesar menos de 1 MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return;
      setBusy(true);
      setFeedback(null);
      try {
        await updateTeamLogoRequest(assignedTeam.id, reader.result);
        setFeedback({ type: 'ok', text: 'Escudo del club actualizado correctamente.' });
        await onRefresh();
      } catch (err) {
        setFeedback({
          type: 'error',
          text: err instanceof Error ? err.message : 'Error al subir escudo.',
        });
      } finally {
        setBusy(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* DT Scope Header */}
      <section className="rounded-lg border border-white/[0.1] bg-[#111114] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <TeamCrest
              name={assignedTeam.name}
              shortName={assignedTeam.shortName}
              primaryColor={assignedTeam.primaryColor}
              secondaryColor={assignedTeam.secondaryColor}
              motif={assignedTeam.motif}
              logoUrl={assignedTeam.logoUrl}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D4AF37]">
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Panel exclusivo de Director Técnico</span>
              </p>
              <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-wide text-[#F5F5F4] leading-tight break-words">
                {assignedTeam.name}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                {competition.name} · Cupo utilizado:{' '}
                <strong className="font-mono-num text-[#F5F5F4]">
                  {activePlayers.length}/{competition.rules.maxActivePlayers}
                </strong>{' '}
                activos · Límite: {competition.rules.registrationDeadline}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="min-h-[40px] inline-flex items-center gap-2 rounded-md border border-white/[0.12] bg-[#0D0D10] px-4 py-2 text-xs font-semibold text-[#F5F5F4] hover:border-[#D4AF37] transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-[#D4AF37]" />
              <span>Cambiar escudo</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoUpload}
                className="sr-only"
              />
            </label>
            {assignedTeam.logoUrl && (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await updateTeamLogoRequest(assignedTeam.id, null);
                  await onRefresh();
                  setBusy(false);
                }}
                className="min-h-[40px] rounded-md border border-white/[0.12] px-3 py-2 text-xs text-zinc-300 hover:text-white cursor-pointer"
              >
                Restaurar escudo base
              </button>
            )}
          </div>
        </div>
      </section>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border-rose-500/40 bg-rose-950/30 text-rose-200'
              : 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Add Player Form */}
      <section className="rounded-lg border border-white/[0.08] bg-[#111114] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wide text-[#F5F5F4]">
              Alta de jugador
            </h2>
            <p className="text-xs text-zinc-400">
              Solo puedes gestionar el plantel de tu club. Los resultados, tarjetas y puntos son
              exclusivos de administración.
            </p>
          </div>
          {isLockedByLeague && (
            <span className="text-xs font-semibold text-amber-400">
              Inscripciones cerradas por administración
            </span>
          )}
          {!isLockedByLeague && isFull && (
            <span className="text-xs font-semibold text-rose-400">
              Plantel lleno ({competition.rules.maxActivePlayers}/
              {competition.rules.maxActivePlayers})
            </span>
          )}
        </div>

        <form onSubmit={handleAddPlayer} className="grid gap-3 sm:grid-cols-12 items-end">
          <div className="sm:col-span-5">
            <label htmlFor="dt-player-name" className="block text-xs text-zinc-400 mb-1">
              Nombre completo
            </label>
            <input
              id="dt-player-name"
              type="text"
              required
              disabled={busy || isLockedByLeague || isFull}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej. Mauricio Blandón"
              className="w-full min-h-[42px] rounded-md border border-white/[0.12] bg-[#0D0D10] px-3 py-2 text-sm text-[#F5F5F4] placeholder:text-zinc-500 focus:border-[#D4AF37] focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="dt-player-dorsal" className="block text-xs text-zinc-400 mb-1">
              Dorsal
            </label>
            <input
              id="dt-player-dorsal"
              type="number"
              min={1}
              max={99}
              required
              disabled={busy || isLockedByLeague || isFull}
              value={newDorsal}
              onChange={(e) => setNewDorsal(e.target.value)}
              placeholder="15"
              className="w-full min-h-[42px] rounded-md border border-white/[0.12] bg-[#0D0D10] px-3 py-2 text-sm font-mono-num text-[#F5F5F4] placeholder:text-zinc-500 focus:border-[#D4AF37] focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="dt-player-pos" className="block text-xs text-zinc-400 mb-1">
              Posición principal
            </label>
            <FlatSelect
              id="dt-player-pos"
              ariaLabel="Posición principal"
              disabled={busy || isLockedByLeague || isFull}
              value={newPrimaryPos}
              onChange={(val) => setNewPrimaryPos(val as PositionCode)}
              options={POSITIONS.map((pos) => ({
                value: pos,
                label: `${pos} · ${getPositionLabel(pos)}`,
              }))}
            />
          </div>

          <div className="sm:col-span-3 flex gap-2">
            <div className="flex-1">
              <label htmlFor="dt-player-pos2" className="block text-xs text-zinc-400 mb-1">
                Secundaria
              </label>
              <FlatSelect
                id="dt-player-pos2"
                ariaLabel="Secundaria"
                disabled={busy || isLockedByLeague || isFull}
                value={newSecondaryPos}
                onChange={(val) => setNewSecondaryPos(val as PositionCode | '')}
                options={[
                  { value: '', label: 'Ninguna' },
                  ...POSITIONS.filter((p) => p !== newPrimaryPos).map((pos) => ({
                    value: pos,
                    label: pos,
                    meta: getPositionLabel(pos),
                  })),
                ]}
              />
            </div>

            <button
              type="submit"
              disabled={busy || isLockedByLeague || isFull}
              className="min-h-[42px] self-end inline-flex items-center gap-1.5 rounded-md bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E5C453] disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Inscribir</span>
            </button>
          </div>
        </form>
      </section>

      {/* Starting 11 Summary */}
      <section className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] px-4 sm:px-5 py-3.5 sm:py-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-[#F5F5F4] inline-flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              <span>Once Titular ({starters.length}/{MAX_STARTERS})</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Selecciona hasta 11 jugadores activos como titulares. Visibles para el público en la
              pestaña Equipos.
            </p>
          </div>
          <div className="font-mono-num text-xs text-zinc-300 flex items-center gap-2.5">
            {POSITIONS.map((pos) => (
              <span key={pos}>
                <strong className="text-[#D4AF37]">
                  {starters.filter((s) => s.primaryPosition === pos).length}
                </strong>{' '}
                {pos}
              </span>
            ))}
          </div>
        </div>

        {starters.length === 0 ? (
          <div className="p-5 text-xs text-zinc-400">
            Aún no has seleccionado titulares. Usa el botón <strong className="text-[#D4AF37]">+ Titular</strong> en la lista de jugadores activos abajo.
          </div>
        ) : (
          <div className="grid gap-2 p-4 sm:p-5 sm:grid-cols-2 lg:grid-cols-3 bg-[#0D0D10]">
            {starters.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center justify-between gap-2 rounded-md border border-[#D4AF37]/30 bg-[#111114] px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono-num text-[11px] text-zinc-500 w-4 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono-num w-7 h-7 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 flex items-center justify-center text-xs font-bold text-[#D4AF37] shrink-0">
                    {player.dorsal}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#F5F5F4] truncate">
                      {player.name}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {player.primaryPosition} · {getPositionLabel(player.primaryPosition)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy || competition.status === 'archived'}
                  onClick={() => void handleToggleStarter(player)}
                  aria-label={`Quitar a ${player.name} de titulares`}
                  className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded border border-white/[0.1] text-zinc-400 hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-40 transition-colors shrink-0 cursor-pointer touch-manipulation"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Roster Editor */}
      <section className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-visible">
        <div className="border-b border-white/[0.08] px-4 sm:px-5 py-3.5 sm:py-4">
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-[#F5F5F4]">
            Jugadores activos ({activePlayers.length})
          </h2>
        </div>

        <div className="divide-y divide-white/[0.07]">
          {activePlayers.map((player) => (
            <div
              key={player.id}
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 sm:px-5 py-3.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono-num w-9 h-9 rounded-md border border-white/[0.12] bg-[#0D0D10] flex items-center justify-center text-sm font-bold text-[#D4AF37] shrink-0">
                  {player.dorsal}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-[#F5F5F4] truncate">
                    {player.name}
                  </div>
                  <div className="text-xs text-zinc-400">
                    Alta: {player.joinedAt}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
                <FlatSelect
                  id={`pos-${player.id}`}
                  ariaLabel={`Posición principal de ${player.name}`}
                  disabled={busy || competition.status === 'archived'}
                  value={player.primaryPosition}
                  onChange={(val) =>
                    void handleUpdatePlayer(player, {
                      primaryPosition: val as PositionCode,
                    })
                  }
                  options={POSITIONS.map((pos) => ({
                    value: pos,
                    label: `Principal: ${pos}`,
                    meta: getPositionLabel(pos),
                  }))}
                  size="sm"
                  className="w-full sm:w-[140px]"
                />

                <FlatSelect
                  id={`pos2-${player.id}`}
                  ariaLabel={`Posición secundaria de ${player.name}`}
                  disabled={busy || competition.status === 'archived'}
                  value={player.secondaryPosition ?? ''}
                  onChange={(val) =>
                    void handleUpdatePlayer(player, {
                      secondaryPosition: val as PositionCode | '',
                    })
                  }
                  options={[
                    { value: '', label: 'Sec: Ninguna' },
                    ...POSITIONS.filter((p) => p !== player.primaryPosition).map((pos) => ({
                      value: pos,
                      label: `Sec: ${pos}`,
                      meta: getPositionLabel(pos),
                    })),
                  ]}
                  size="sm"
                  align="right"
                  className="w-full sm:w-[140px]"
                />

                {(() => {
                  const isStarter = starterIdSet.has(player.id);
                  return (
                    <button
                      type="button"
                      disabled={
                        busy ||
                        competition.status === 'archived' ||
                        (!isStarter && starters.length >= MAX_STARTERS)
                      }
                      onClick={() => void handleToggleStarter(player)}
                      aria-label={
                        isStarter
                          ? `Quitar a ${player.name} de titulares`
                          : `Añadir a ${player.name} a titulares`
                      }
                      className={`min-h-[40px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer touch-manipulation disabled:opacity-40 ${
                        isStarter
                          ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/25'
                          : 'border-white/[0.12] bg-[#0D0D10] text-zinc-200 hover:border-[#D4AF37]/60 hover:text-[#D4AF37]'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isStarter ? 'Titular' : '+ Titular'}</span>
                    </button>
                  );
                })()}

                {user.role === 'dt' && teams.length > 1 && (
                  <button
                    type="button"
                    disabled={busy || competition.status === 'archived'}
                    onClick={() => setTransferPlayerId(player.id)}
                    aria-label={`Transferir a ${player.name}`}
                    className="min-h-[40px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-md border border-[#D4AF37]/40 px-3 py-1.5 text-xs font-medium text-[#D4AF37] hover:bg-[#D4AF37]/15 transition-colors cursor-pointer touch-manipulation"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Transferir</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={busy || competition.status === 'archived'}
                  onClick={() => void handleUpdatePlayer(player, { status: 'archived' })}
                  aria-label={`Dar de baja a ${player.name}`}
                  className="min-h-[40px] sm:min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-md border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer touch-manipulation"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Dar de baja</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Archived Players History */}
      {archivedPlayers.length > 0 && (
        <section className="rounded-lg border border-white/[0.08] bg-[#111114] overflow-hidden">
          <div className="border-b border-white/[0.08] px-4 sm:px-5 py-3.5 sm:py-4">
            <h2 className="font-display text-xl font-bold tracking-wide text-zinc-200">
              Bajas archivadas ({archivedPlayers.length})
            </h2>
            <p className="text-xs text-zinc-400">
              Los jugadores dados de baja conservan sus goles y tarjetas históricas en la liga.
            </p>
          </div>
          <div className="divide-y divide-white/[0.07]">
            {archivedPlayers.map((player) => (
              <div
                key={player.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 sm:px-5 py-3 text-sm"
              >
                <div>
                  <span className="font-medium text-zinc-300">
                    #{player.dorsal} {player.name}
                  </span>
                  <span className="ml-2 text-xs text-zinc-500">
                    Baja: {player.archivedAt ?? '—'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={busy || isLockedByLeague || isFull}
                  onClick={() => void handleUpdatePlayer(player, { status: 'active' })}
                  className="min-h-[38px] self-start sm:self-auto inline-flex items-center gap-1.5 rounded-md border border-white/[0.12] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reactivar</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <TransferPlayerModal
        isOpen={transferPlayerId !== null}
        sourceTeam={assignedTeam}
        teams={teams}
        players={players}
        initialPlayerId={transferPlayerId}
        user={user}
        competitionStatus={competition.status}
        maxActivePlayers={competition.rules.maxActivePlayers}
        onClose={() => setTransferPlayerId(null)}
        onOpenAuth={onOpenAuth}
        onSuccess={async (msg) => {
          setFeedback({ type: 'ok', text: msg });
          await onRefresh();
        }}
      />
    </div>
  );
}
