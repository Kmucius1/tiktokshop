export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function hoursAgo(value: string | null | undefined): number {
  if (!value) return 9999
  return (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60)
}

export function daysUntil(value: string | null | undefined): number {
  if (!value) return -9999
  return (new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
}

export function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from)
  let added = 0
  while (added < days) {
    date.setDate(date.getDate() + 1)
    const day = date.getDay()
    if (day !== 0 && day !== 6) added++
  }
  return date
}
