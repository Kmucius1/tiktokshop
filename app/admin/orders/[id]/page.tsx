export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { OrderRiskBadge } from '@/components/admin/OrderRiskBadge'
import { AdminNoteForm } from '@/components/admin/AdminNoteForm'
import { formatMoney } from '@/lib/utils/money'
import { formatDateTime } from '@/lib/utils/dates'
import { evaluateOrderRisk } from '@/lib/fulfillment/risk'
import { CheckCircle2, XCircle } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: order },
    { data: items },
    { data: events },
    { data: tracking },
    { data: notes },
  ] = await Promise.all([
    supabase.from('orders').select('*, suppliers(*)').eq('id', id).single(),
    supabase.from('order_items').select('*, products(title, slug), suppliers(name)').eq('order_id', id),
    supabase.from('order_fulfillment_events').select('*').eq('order_id', id).order('created_at', { ascending: false }),
    supabase.from('tracking_events').select('*').eq('order_id', id).order('created_at', { ascending: false }).limit(1),
    supabase.from('admin_notes').select('*, profiles(full_name)').eq('entity_type', 'order').eq('entity_id', id).order('created_at', { ascending: false }),
  ])

  if (!order) notFound()

  const risk = evaluateOrderRisk(order)
  const latestTracking = tracking?.[0]

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between py-2 text-sm border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value ?? '—'}</span>
    </div>
  )

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order {order.shopify_order_id ?? order.tiktok_order_id ?? order.id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-sm text-gray-500 capitalize">{order.channel} order · {order.fulfillment_status}</p>
        </div>
        <OrderRiskBadge level={order.sla_risk_status} label={risk.label} />
      </div>

      {/* Risk alert */}
      {risk.level !== 'green' && (
        <div className={`mb-6 rounded-xl border px-5 py-4 ${
          risk.level === 'red' ? 'border-red-200 bg-red-50' :
          risk.level === 'orange' ? 'border-orange-200 bg-orange-50' :
          'border-yellow-200 bg-yellow-50'
        }`}>
          <p className={`text-sm font-semibold ${
            risk.level === 'red' ? 'text-red-700' :
            risk.level === 'orange' ? 'text-orange-700' :
            'text-yellow-700'
          }`}>{risk.reason}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Order info */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">Order Details</h3>
            {row('Shopify Order ID', order.shopify_order_id)}
            {row('TikTok Order ID', order.tiktok_order_id)}
            {row('Channel', <span className="capitalize">{order.channel}</span>)}
            {row('Order Time', formatDateTime(order.order_time))}
            {row('Required Ship By', formatDateTime(order.required_ship_by_time))}
            {row('Payment Status', order.payment_status)}
            {row('Fulfillment Status', order.fulfillment_status)}
            {row('Total', formatMoney(order.total_price))}
            {row('Landed Cost', formatMoney(order.landed_cost_total))}
            {row('Gross Margin', formatMoney(order.gross_margin))}
          </div>

          {/* Customer */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">Customer</h3>
            {row('Name', order.customer_name)}
            {row('Email', order.customer_email)}
            {row('State', order.customer_state)}
          </div>

          {/* Tracking */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">Tracking</h3>
            {row('Tracking Uploaded', order.tracking_uploaded
              ? <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" /> Yes</span>
              : <span className="flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4" /> No</span>)}
            {row('Tracking Number', order.tracking_number)}
            {row('Carrier', order.tracking_carrier)}
            {row('Tracking Status', order.tracking_status)}
            {latestTracking && (
              <>
                {row('Last Scan', latestTracking.last_scan_location)}
                {row('Scan Time', formatDateTime(latestTracking.last_scan_time))}
                {row('Estimated Delivery', latestTracking.estimated_delivery)}
              </>
            )}
          </div>

          {/* Items */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-700">Order Items</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500">
                  <th className="px-5 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Qty</th>
                  <th className="px-4 py-3 text-left font-medium">Price</th>
                  <th className="px-4 py-3 text-left font-medium">Cost</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(items ?? []).map(item => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 text-gray-900">
                      {(item.products as { title: string } | null)?.title ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.quantity}</td>
                    <td className="px-4 py-3">{formatMoney(item.selling_price)}</td>
                    <td className="px-4 py-3">{formatMoney(item.landed_cost)}</td>
                    <td className="px-4 py-3 capitalize text-gray-500">{item.fulfillment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fulfillment events */}
          {(events ?? []).length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-700">Fulfillment Events</h3>
              </div>
              <ul className="divide-y divide-gray-50">
                {(events ?? []).map(ev => (
                  <li key={ev.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-gray-700">{ev.event_type}</span>
                      <span className="text-xs text-gray-400">{formatDateTime(ev.created_at)}</span>
                    </div>
                    {ev.event_message && <p className="mt-0.5 text-xs text-gray-500">{ev.event_message}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <AdminNoteForm entityType="order" entityId={order.id} notes={notes ?? []} />
        </div>

        {/* Supplier sidebar */}
        <div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">Supplier</h3>
            {order.suppliers ? (
              <>
                {row('Name', (order.suppliers as { name: string }).name)}
                {row('Approved', (order.suppliers as { approved: boolean }).approved ? 'Yes' : 'No')}
                {row('Warehouse', (order.suppliers as { warehouse_country?: string }).warehouse_country)}
              </>
            ) : (
              <p className="text-sm text-red-600">No supplier assigned</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
