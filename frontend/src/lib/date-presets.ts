export interface DatePreset {
  label: string
  value: string
  getDates: () => { start: Date; end: Date } | null
}

export const DATE_PRESETS: DatePreset[] = [
  {
    label: 'Last 7 days',
    value: '7d',
    getDates: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)
      return { start, end }
    },
  },
  {
    label: 'Last 30 days',
    value: '30d',
    getDates: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      return { start, end }
    },
  },
  {
    label: 'Last 90 days',
    value: '90d',
    getDates: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 90)
      return { start, end }
    },
  },
  {
    label: 'Custom',
    value: 'custom',
    getDates: () => null,
  },
]

export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0]
}
