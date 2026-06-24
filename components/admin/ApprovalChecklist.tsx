import type { ProductChecklist, ChecklistStatus } from '@/types/supabase'
import { cn } from '@/lib/utils/cn'
import { CheckCircle2, XCircle, Clock, MinusCircle } from 'lucide-react'

interface Props {
  checklist: ProductChecklist
}

const items: { key: keyof ProductChecklist; label: string }[] = [
  { key: 'supplier_verified', label: 'Supplier verified' },
  { key: 'shipping_verified', label: 'Shipping times confirmed' },
  { key: 'tracking_verified', label: 'Tracking confirmed with carrier' },
  { key: 'returns_verified', label: 'Return policy confirmed' },
  { key: 'compliance_checked', label: 'Compliance review complete' },
  { key: 'ip_checked', label: 'IP / trademark check complete' },
  { key: 'margin_checked', label: 'Margin acceptable (≥40%)' },
  { key: 'test_order_placed', label: 'Test order placed' },
  { key: 'test_order_passed', label: 'Test order passed' },
  { key: 'approved_for_shopify', label: 'Approved for Shopify' },
  { key: 'approved_for_tiktok', label: 'Approved for marketplace' },
]

function StatusIcon({ status }: { status: ChecklistStatus }) {
  if (status === 'passed') return <CheckCircle2 className="h-4 w-4 text-green-500" />
  if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />
  if (status === 'waived') return <MinusCircle className="h-4 w-4 text-gray-400" />
  return <Clock className="h-4 w-4 text-gray-300" />
}

function labelColor(status: ChecklistStatus): string {
  if (status === 'passed') return 'text-gray-900'
  if (status === 'failed') return 'text-red-600'
  if (status === 'waived') return 'text-gray-400 line-through'
  return 'text-gray-400'
}

export function ApprovalChecklist({ checklist }: Props) {
  const passed = items.filter(i => (checklist[i.key] as ChecklistStatus) === 'passed').length
  const total = items.length

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-700">Approval Checklist</h3>
        <span className="text-sm text-gray-500">{passed}/{total} complete</span>
      </div>
      <ul className="divide-y divide-gray-50">
        {items.map(item => {
          const status = checklist[item.key] as ChecklistStatus
          return (
            <li key={item.key} className="flex items-center gap-3 px-5 py-3">
              <StatusIcon status={status} />
              <span className={cn('text-sm', labelColor(status))}>{item.label}</span>
              {status === 'waived' && (
                <span className="ml-auto text-xs text-gray-400">Waived</span>
              )}
            </li>
          )
        })}
      </ul>
      {checklist.notes && (
        <div className="border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-500">{checklist.notes}</p>
        </div>
      )}
    </div>
  )
}
