import { cn } from '@/lib/utils/cn'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: number | string
  icon: LucideIcon
  trend?: string
  variant?: 'default' | 'danger' | 'warning' | 'success'
  href?: string
}

export function AdminStatCard({ label, value, icon: Icon, trend, variant = 'default', href }: Props) {
  const colors = {
    default: 'text-gray-700',
    danger: 'text-red-600',
    warning: 'text-orange-600',
    success: 'text-green-600',
  }

  const iconBg = {
    default: 'bg-gray-100 text-gray-600',
    danger: 'bg-red-100 text-red-600',
    warning: 'bg-orange-100 text-orange-600',
    success: 'bg-green-100 text-green-600',
  }

  const content = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={cn('mt-1 text-3xl font-bold', colors[variant])}>{value}</p>
        {trend && <p className="mt-1 text-xs text-gray-400">{trend}</p>}
      </div>
      <div className={cn('rounded-lg p-2', iconBg[variant])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {content}
    </div>
  )
}
