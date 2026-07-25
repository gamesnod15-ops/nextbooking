import { format, formatDistanceToNow, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { tr } from 'date-fns/locale';

export function formatDate(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return 'Bugün';
  if (isTomorrow(d)) return 'Yarın';
  if (isYesterday(d)) return 'Dün';
  return format(d, 'd MMM yyyy', { locale: tr });
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm');
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'd MMM HH:mm', { locale: tr });
}

export function formatCurrency(amount: number): string {
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: tr });
}

// Appointment start/end times are stored as Turkey wall-clock time tagged
// with a +00:00 offset (not a genuine UTC instant), so formatting them with
// the device's local timezone shifts the displayed hour by the device's UTC
// offset. Read the raw UTC components directly instead of converting them.
export function appointmentLocalDate(iso: string): Date {
  const d = parseISO(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
}

export function formatAppointmentDate(iso: string): string {
  const d = appointmentLocalDate(iso);
  if (isToday(d)) return 'Bugün';
  if (isTomorrow(d)) return 'Yarın';
  if (isYesterday(d)) return 'Dün';
  return format(d, 'd MMM yyyy', { locale: tr });
}

export function formatAppointmentTime(iso: string): string {
  return format(appointmentLocalDate(iso), 'HH:mm');
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
