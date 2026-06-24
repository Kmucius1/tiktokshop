import type { Order, SlaRisk } from '@/types/supabase'
import { hoursAgo, daysUntil } from '@/lib/utils/dates'

export interface RiskFlag {
  level: SlaRisk
  label: string
  reason: string
}

export function evaluateOrderRisk(order: Order): RiskFlag {
  const hoursSinceOrder = hoursAgo(order.order_time)
  const daysToShipBy = daysUntil(order.required_ship_by_time)

  // Critical — past or imminent deadline
  if (order.required_ship_by_time && daysToShipBy < 0) {
    return { level: 'red', label: 'Critical', reason: 'Past required ship-by deadline' }
  }
  if (order.required_ship_by_time && daysToShipBy < 0.5) {
    return { level: 'red', label: 'Critical', reason: 'Ship-by deadline in less than 12 hours' }
  }

  // Red — tracking uploaded but no carrier scan
  if (order.tracking_uploaded && order.tracking_status === 'label_created') {
    return { level: 'red', label: 'Critical', reason: 'Tracking label created but no carrier scan' }
  }

  // Red — supplier issue or sync error
  if (order.exception_reason?.includes('stock') || order.exception_reason?.includes('supplier')) {
    return { level: 'red', label: 'Critical', reason: order.exception_reason }
  }

  // Orange — no tracking after 24h
  if (!order.tracking_uploaded && hoursSinceOrder >= 24) {
    return { level: 'orange', label: 'Action Needed', reason: 'No tracking uploaded after 24 hours' }
  }

  // Yellow — no tracking after 12h
  if (!order.tracking_uploaded && hoursSinceOrder >= 12) {
    return { level: 'yellow', label: 'Watch', reason: 'No tracking uploaded after 12 hours' }
  }

  // Green — all clear
  return { level: 'green', label: 'Safe', reason: 'Order on track' }
}

export function getOrderRiskBadgeStyle(level: SlaRisk): string {
  const styles: Record<SlaRisk, string> = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  }
  return styles[level]
}

export function getOrderRiskLabel(level: SlaRisk): string {
  const labels: Record<SlaRisk, string> = {
    green: 'Safe',
    yellow: 'Watch',
    orange: 'Action Needed',
    red: 'Critical',
  }
  return labels[level]
}
