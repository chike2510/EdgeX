export function formatProbability(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Unavailable';
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return 'Unavailable';
  const percent = number <= 1 ? number * 100 : number;
  if (percent < 0 || percent > 100) return 'Unavailable';
  return `${Math.round(percent)}%`;
}

export function formatUsd(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Unavailable';
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return 'Unavailable';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 7 }).format(number);
}

export function formatPercent(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Unavailable';
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return 'Unavailable';
  return `${number > 0 ? '+' : ''}${number.toFixed(2)}%`;
}

export function formatDate(value: unknown): string {
  if (typeof value !== 'string' || !value) return 'Time unavailable';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'Time unavailable';
}

export function text(value: unknown, fallback = 'Unavailable'): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
