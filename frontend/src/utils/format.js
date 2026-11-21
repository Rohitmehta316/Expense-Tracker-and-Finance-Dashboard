import { format } from 'date-fns';

export function currency(value, code = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(value || 0);
}

export function day(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '—' : format(date, 'dd MMM yyyy');
}
