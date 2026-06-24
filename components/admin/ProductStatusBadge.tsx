import { cn } from '@/lib/utils/cn'
import type { ProductStatus } from '@/types/supabase'

interface Props {
  status: ProductStatus
  className?: string
}

const statusConfig: Record<ProductStatus, { label: string; className: string }> = {
  'Researching': { label: 'Researching', className: 'bg-gray-100 text-gray-700' },
  'Supplier Review': { label: 'Supplier Review', className: 'bg-purple-100 text-purple-700' },
  'Shipping Review': { label: 'Shipping Review', className: 'bg-blue-100 text-blue-700' },
  'Compliance Review': { label: 'Compliance Review', className: 'bg-yellow-100 text-yellow-800' },
  'Test Order Required': { label: 'Test Order Required', className: 'bg-orange-100 text-orange-700' },
  'Approved for TikTok Shop': { label: 'Ready for review', className: 'bg-pink-100 text-pink-700' },
  'Live': { label: 'Live', className: 'bg-green-100 text-green-700' },
  'Scaling': { label: 'Scaling', className: 'bg-emerald-100 text-emerald-800' },
  'Paused': { label: 'Paused', className: 'bg-slate-100 text-slate-600' },
  'Disabled': { label: 'Disabled', className: 'bg-red-100 text-red-700' },
}

export function ProductStatusBadge({ status, className }: Props) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  )
}
