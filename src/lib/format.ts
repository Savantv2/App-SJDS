import type { MatchStatus } from '../types/league';

export function formatMatchDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-NI', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Managua',
  }).format(date);
}

export function formatMatchTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-NI', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Managua',
  }).format(date);
}

export function formatDateTimeFull(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Managua',
  }).format(date);
}

export function getMatchStatusLabel(status: MatchStatus, liveMinute?: number): string {
  switch (status) {
    case 'en_juego':
      return liveMinute ? `En juego · ${liveMinute}'` : 'En juego';
    case 'finalizado':
      return 'Finalizado';
    case 'suspendido':
      return 'Suspendido';
    case 'programado':
    default:
      return 'Programado';
  }
}

export function getMatchStatusTextColor(status: MatchStatus): string {
  switch (status) {
    case 'en_juego':
      return 'text-[#D4AF37]';
    case 'finalizado':
      return 'text-zinc-400';
    case 'suspendido':
      return 'text-rose-400';
    case 'programado':
    default:
      return 'text-emerald-400';
  }
}
