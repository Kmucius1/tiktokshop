import { cn } from '@/lib/utils/cn'
import type { SlaRisk } from '@/types/supabase'

interface Props {
  level: SlaRisk
  label?: string
}

const config: Record<SlaRisk, { bg: string; dot: string; label: string }> = {
  green: { bg: 'bg-green-100 text-green-800', dot: 'bg-green-500', label: 'Safe' },
  yellow: { bg: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500', label: 'Watch' },
  orange: { bg: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500', label: 'Action Needed' },
  red: { bg: 'bg-red-100 text-red-800', dot: 'bg-red-500', label: 'Critical' },
}

export function OrderRiskBadge({ level, label }: Props) {
  const c = config[level]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', c.bg)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {label ?? c.label}
    </span>
  )
}
