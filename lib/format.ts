import { CurrencySettings, InvoiceStatus } from './types';
import { DEFAULT_CURRENCY } from './currencies';

export const AR_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISO(s: string): Date {
  const parts = (s || '').split('-').map(Number);
  const y = parts[0] || new Date().getFullYear();
  const m = parts[1] || 1;
  const d = parts[2] || 1;
  return new Date(y, m - 1, d);
}

export function formatDate(s?: string | null): string {
  if (!s) return '—';
  const d = parseISO(s);
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(s?: string | null): string {
  if (!s) return '—';
  const d = parseISO(s);
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

export function formatDayWithWeekday(s?: string | null): string {
  if (!s) return '—';
  const d = parseISO(s);
  return `${AR_DAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
}

export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthKeyOf(iso: string): string {
  return (iso || '').slice(0, 7);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return key;
  return `${AR_MONTHS[m - 1]} ${y}`;
}

export function monthLabelShort(key: string): string {
  const [, m] = key.split('-').map(Number);
  if (!m) return key;
  return AR_MONTHS[m - 1];
}

export function addMonthsToKey(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthRange(key: string): { start: string; end: string } {
  const [y, m] = key.split('-').map(Number);
  const start = new Date(y, (m || 1) - 1, 1);
  const end = new Date(y, m || 1, 0);
  return { start: toISODate(start), end: toISODate(end) };
}

export function lastMonthKeys(count: number, fromKey: string = currentMonthKey()): string[] {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) out.push(addMonthsToKey(fromKey, -i));
  return out;
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = parseISO(fromISO).getTime();
  const b = parseISO(toISO).getTime();
  return Math.round((b - a) / 86400000);
}

export function groupNumber(
  value: number,
  opts: { thousands?: string; decimals?: number; decimalSep?: string } = {}
): string {
  const thousands = opts.thousands ?? ',';
  const decimals = Math.max(0, Math.min(4, opts.decimals ?? 2));
  const decimalSep = opts.decimalSep ?? '.';
  const safe = Number.isFinite(value) ? value : 0;
  const neg = safe < 0;
  const fixed = Math.abs(safe).toFixed(decimals);
  const dotIndex = fixed.indexOf('.');
  let intPart = dotIndex >= 0 ? fixed.slice(0, dotIndex) : fixed;
  const fracPart = dotIndex >= 0 ? fixed.slice(dotIndex + 1) : '';
  intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, () => thousands);
  const body = fracPart ? `${intPart}${decimalSep}${fracPart}` : intPart;
  return `${neg ? '-' : ''}${body}`;
}

export function formatMoney(amount: number, currency?: CurrencySettings | null): string {
  const c = currency ?? DEFAULT_CURRENCY;
  const num = groupNumber(amount, {
    thousands: c.thousands || ',',
    decimals: c.decimals ?? 2,
    decimalSep: c.decimalSep || '.',
  });
  const symbol = (c.symbol || '').trim() || (c.code || '').trim();
  if (!symbol) return num;
  return c.placement === 'before' ? `${symbol} ${num}` : `${num} ${symbol}`;
}

export function formatNumber(value: number, decimals = 0): string {
  return groupNumber(value, { thousands: ',', decimals, decimalSep: '.' });
}

export function formatQuantity(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2);
}

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'مسودة',
  issued: 'مستحقة',
  paid: 'مدفوعة',
};

export function percent(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function escapeHtml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}
