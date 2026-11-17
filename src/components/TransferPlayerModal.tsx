import { ArrowLeftRight, Lock, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { transferPlayerRequest } from '../lib/api';
import { findNextAvailableDorsal } from '../lib/leagueEngine';
import type { Player, PublicUser, Team } from '../types/league';
import { FlatSelect } from './FlatSelect';

interface TransferPlayerModalProps {
  isOpen: boolean;
  sourceTeam: Team;
  teams: Team[];
  players: Player[];
  initialPlayerId?: string | null;
  user: PublicUser | null;
  competitionStatus: 'active' | 'archived';
  maxActivePlayers: number;
  onClose: () => void;
  onOpenAuth: () => void;
  onSuccess: (message: string) => Promise<void>;
}

export function TransferPlayerModal({
  isOpen,
  sourceTeam,
  teams,
  players,
  initialPlayerId,
  user,
  competitionStatus,
  maxActivePlayers,
  onClose,
  onOpenAuth,
  onSuccess,
}: TransferPlayerModalProps) {
  const sourceActivePlayers = useMemo(
    () =>
      players
        .filter((p) => p.teamId === sourceTeam.id && p.status === 'active')
        .slice()
        .sort((a, b) => a.dorsal - b.dorsal),
    [players, sourceTeam.id]
  );

  const destinationTeams = useMemo(
    () => teams.filter((t) => t.id !== sourceTeam.id),
    [teams, sourceTeam.id]
  );

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [targetTeamId, setTargetTeamId] = useState<string>('');
  const [dorsal, setDorsal] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setReason('');
    const defaultPlayer =
      (initialPlayerId && sourceActivePlayers.find((p) => p.id === initialPlayerId)) ||
      sourceActivePlayers[0];
    const defaultTarget = destinationTeams[0];
    setSelectedPlayerId(defaultPlayer?.id ?? '');
    setTargetTeamId(defaultTarget?.id ?? '');
  }, [isOpen, initialPlayerId, sourceActivePlayers, destinationTeams]);

  const selectedPlayer = sourceActivePlayers.find((p) => p.id === selectedPlayerId);
  const targetTeam = destinationTeams.find((t) => t.id === targetTeamId);
  const targetPlayers = useMemo(
    () => players.filter((p) => p.teamId === targetTeamId),
    [players, targetTeamId]
  );
  const targetActivePlayers = useMemo(
    () => targetPlayers.filter((p) => p.status === 'active'),
    [targetPlayers]
  );

  const dorsalOccupiedInTarget = Boolean(
    selectedPlayer &&
      targetActivePlayers.some((p) => p.dorsal === selectedPlayer.dorsal)
  );

  useEffect(() => {
    if (!isOpen || !selectedPlayer || !targetTeamId) return;
    const suggested = findNextAvailableDorsal(targetPlayers, selectedPlayer.dorsal);
    setDorsal(String(suggested));
  }, [isOpen, selectedPlayerId, targetTeamId, selectedPlayer, targetPlayers]);

  if (!isOpen) return null;

  const canTransfer =
    user !== null &&
    user.role === 'dt' &&
    (user.assignedTeamId === sourceTeam.id || sourceTeam.dtUserId === user.id);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer || !targetTeam) return;
    setError(null);
    setBusy(true);
    try {
      const nextDorsal = Number(dorsal);
      await transferPlayerRequest(sourceTeam.id, selectedPlayer.id, {
        targetTeamId: targetTeam.id,
        dorsal: nextDorsal,
        reason: reason.trim() || undefined,
      });
      await onSuccess(
        `${selectedPlayer.name} fue transferido de ${sourceTeam.name} a ${targetTeam.name} con el dorsal #${nextDorsal}.`
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar la transferencia.');
    } finally {
      setBusy(false);
    }
  };

  const playerOptions = sourceActivePlayers.map((p) => ({
    value: p.id,
    label: `#${p.dorsal} ${p.name}`,
    meta: p.primaryPosition,
  }));

  const targetOptions = destinationTeams.map((t) => {
    const count = players.filter((p) => p.teamId === t.id && p.status === 'active').length;
    return {
      value: t.id,
      label: t.name,
      meta: `${count}/${maxActivePlayers} activos`,
    };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-modal-title"
    >
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-xl border border-white/[0.12] bg-[#111114] pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#111114] px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <ArrowLeftRight className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <div className="min-w-0">
              <h2
                id="transfer-modal-title"
                className="font-display text-xl sm:text-2xl font-bold tracking-wide text-[#F5F5F4]"
              >
                Transferir jugador
              </h2>
              <p className="text-xs text-zinc-400 truncate">Club de origen: {sourceTeam.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de transferencia"
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-md border border-white/[0.1] bg-[#0D0D10] text-zinc-400 hover:text-white shrink-0 cursor-pointer touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {!canTransfer ? (
            <div className="space-y-4 text-center py-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10">
                <Lock className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-[#F5F5F4]">
                  Acceso requerido para transferencias
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {user
                    ? `Solo el Director Técnico de ${sourceTeam.name} puede transferir jugadores de su propio plantel.`
                    : `Inicia sesión como Director Técnico de ${sourceTeam.name} para transferir jugadores de tu plantel.`}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[40px] rounded-md border border-white/[0.12] px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="min-h-[40px] rounded-md bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#0A0A0A] hover:bg-[#E5C453] cursor-pointer"
                >
                  Iniciar sesión
                </button>
              </div>
            </div>
          ) : competitionStatus === 'archived' ? (
            <p className="text-sm text-amber-300">
              Esta competencia está archivada y no permite transferencias de jugadores.
            </p>
          ) : sourceActivePlayers.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No hay jugadores activos disponibles para transferir en {sourceTeam.name}.
            </p>
          ) : destinationTeams.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No hay otros clubes registrados en esta competencia como destino.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-rose-500/40 bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-200"
                >
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="tr-player" className="block text-xs text-zinc-400 mb-1">
                  Jugador a transferir
                </label>
                <FlatSelect
                  id="tr-player"
                  ariaLabel="Jugador a transferir"
                  value={selectedPlayerId}
                  onChange={setSelectedPlayerId}
                  options={playerOptions}
                  menuClassName="w-full"
                />
              </div>

              <div>
                <label htmlFor="tr-target" className="block text-xs text-zinc-400 mb-1">
                  Equipo destino
                </label>
                <FlatSelect
                  id="tr-target"
                  ariaLabel="Equipo destino"
                  value={targetTeamId}
                  onChange={setTargetTeamId}
                  options={targetOptions}
                  menuClassName="w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="tr-dorsal" className="block text-xs text-zinc-400 mb-1">
                    Dorsal en destino
                  </label>
                  <input
                    id="tr-dorsal"
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={dorsal}
                    onChange={(e) => setDorsal(e.target.value)}
                    className="w-full min-h-[42px] rounded-md border border-white/[0.12] bg-[#0D0D10] px-3 py-2 text-sm font-mono-num text-[#F5F5F4] focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="tr-reason" className="block text-xs text-zinc-400 mb-1">
                    Motivo / Acta (opcional)
                  </label>
                  <input
                    id="tr-reason"
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej. Acuerdo entre clubes"
                    className="w-full min-h-[42px] rounded-md border border-white/[0.12] bg-[#0D0D10] px-3 py-2 text-sm text-[#F5F5F4] placeholder:text-zinc-500 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              {dorsalOccupiedInTarget && selectedPlayer && targetTeam && (
                <p className="text-xs text-amber-300">
                  El dorsal #{selectedPlayer.dorsal} ya está asignado en {targetTeam.name}; se
                  sugirió automáticamente el dorsal libre #{dorsal}.
                </p>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[40px] rounded-md border border-white/[0.12] px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[40px] inline-flex items-center gap-2 rounded-md bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E5C453] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>{busy ? 'Transfiriendo...' : 'Confirmar transferencia'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
