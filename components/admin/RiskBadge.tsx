import { cn } from '@/lib/utils/cn'
import type { RiskLevel } from '@/types/supabase'

interface Props {
  level: RiskLevel
}

const config: Record<RiskLevel, { className: string; label: string }> = {
  low: { className: 'bg-green-100 text-green-700', label: 'Low Risk' },
  medium: { className: 'bg-yellow-100 text-yellow-800', label: 'Medium Risk' },
  high: { className: 'bg-red-100 text-red-700', label: 'High Risk' },
}

export function RiskBadge({ level }: Props) {
  const c = config[level]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', c.className)}>
      {c.label}
    </span>
  )
}
