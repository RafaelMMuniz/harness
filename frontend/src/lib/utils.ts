import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export const CHART_COLORS = ['#FF7F11', '#FFa84d', '#FFc98a', '#FFdbb0', '#FFead0'];
export const CHART_OTHER_COLOR = '#A3A3A3';
export const CHART_BG = '#FEF9F3';
