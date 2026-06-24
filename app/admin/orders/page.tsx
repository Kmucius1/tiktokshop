export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { OrderRiskBadge } from '@/components/admin/OrderRiskBadge'
import { formatMoney } from '@/lib/utils/money'
import { formatDateTime } from '@/lib/utils/dates'
import { evaluateOrderRisk } from '@/lib/fulfillment/risk'
import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('*, suppliers(name)')
    .order('order_time', { ascending: false })
    .limit(100)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">{orders?.length ?? 0} recent orders</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-5 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Channel</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Supplier</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Tracking</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">SLA Risk</th>
                <th className="px-4 py-3 text-left font-medium">Ordered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(orders ?? []).map(order => {
                const risk = evaluateOrderRisk(order)
                const supplier = order.suppliers as { name: string } | null
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-sky-600 hover:underline">
                        {order.shopify_order_id ?? order.tiktok_order_id ?? order.id.slice(0, 8)}
                      </Link>
                      {order.manual_action_needed && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Action Needed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-500">{order.channel}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{order.customer_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{order.customer_state ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{supplier?.name ?? <span className="text-red-500 text-xs">No supplier</span>}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatMoney(order.total_price)}</td>
                    <td className="px-4 py-3">
                      {order.tracking_uploaded
                        ? <div className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="h-3.5 w-3.5" />{order.tracking_number ?? 'Uploaded'}</div>
                        : <span className="flex items-center gap-1 text-red-500 text-xs"><XCircle className="h-3.5 w-3.5" />No tracking</span>}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-500">{order.fulfillment_status}</td>
                    <td className="px-4 py-3">
                      <OrderRiskBadge level={order.sla_risk_status} label={risk.label} />
                      {order.exception_reason && (
                        <p className="mt-0.5 text-xs text-gray-400 truncate max-w-[140px]">{order.exception_reason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(order.order_time)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {(orders ?? []).length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">No orders yet.</div>
        )}
      </div>
    </div>
  )
}
