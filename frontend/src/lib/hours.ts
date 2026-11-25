import type { CafeSettings } from '@/types';
import { DAY_NAMES } from '@/data/settings';

/** Current time in Sri Lanka (UTC+05:30), whatever the visitor's timezone. */
export function sriLankaNow(): Date {
  const d = new Date();
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000 + 330 * 60000);
}

export const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export function isOpenNow(s: CafeSettings): boolean {
  const n = sriLankaNow();
  if (s.closedDays.includes(n.getDay())) return false;
  const m = n.getHours() * 60 + n.getMinutes();
  return m >= toMin(s.openTime) && m < toMin(s.closeTime);
}

export function todayISO(): string {
  const n = sriLankaNow();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

/** Half-hour booking slots from opening until 30 min before closing, as HH:mm. */
export function timeSlots(s: CafeSettings): string[] {
  const out: string[] = [];
  const start = Math.ceil(toMin(s.openTime) / 30) * 30;
  for (let m = start; m <= toMin(s.closeTime) - 30; m += 30) out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`);
  return out;
}

export function to12h(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
export const shortTime = (t: string) => to12h(t).replace(':00 ', ' ');

export function hoursLabel(s: CafeSettings): string {
  const days = s.closedDays.length ? ` · closed ${s.closedDays.map((d) => DAY_NAMES[d].slice(0, 3)).join(', ')}` : '';
  return `${shortTime(s.openTime)} – ${shortTime(s.closeTime)}${days}`;
}

export const telHref = (phone: string) => 'tel:' + phone.replace(/[^\d+]/g, '').replace(/^0/, '+94');

/** 'day' from 6 AM to 5 PM Sri Lanka time, otherwise 'evening' (used for scene lighting). */
export function daypart(): 'day' | 'evening' {
  const h = sriLankaNow().getHours();
  return h >= 6 && h < 17 ? 'day' : 'evening';
}
