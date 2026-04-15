export interface DatePreset {
  label: string;
  value: string;
  getDates: () => { start: Date; end: Date } | null;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export const DATE_PRESETS: DatePreset[] = [
  { label: 'Last 7 days', value: '7d', getDates: () => ({ start: daysAgo(7), end: new Date() }) },
  { label: 'Last 30 days', value: '30d', getDates: () => ({ start: daysAgo(30), end: new Date() }) },
  { label: 'Last 90 days', value: '90d', getDates: () => ({ start: daysAgo(90), end: new Date() }) },
  { label: 'Custom', value: 'custom', getDates: () => null },
];

export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}
