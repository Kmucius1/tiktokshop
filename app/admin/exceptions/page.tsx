export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { OrderRiskBadge } from '@/components/admin/OrderRiskBadge'
import { ProductStatusBadge } from '@/components/admin/ProductStatusBadge'
import { ScoreBadge } from '@/components/admin/ScoreBadge'
import { formatDateTime } from '@/lib/utils/dates'
import { formatMoney } from '@/lib/utils/money'
import { evaluateOrderRisk } from '@/lib/fulfillment/risk'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default async function ExceptionsPage() {
  const supabase = await createClient()

  const [
    { data: riskOrders },
    { data: noSupplierProducts },
    { data: slowProducts },
    { data: noTrackingProducts },
    { data: complianceRiskProducts },
  ] = await Promise.all([
    supabase.from('orders')
      .select('*, suppliers(name)')
      .in('sla_risk_status', ['orange', 'red'])
      .order('order_time', { ascending: true })
      .limit(50),
    supabase.from('products')
      .select('id, title, status, score, category')
      .is('primary_supplier_id', null)
      .neq('status', 'Disabled')
      .limit(20),
    supabase.from('products')
      .select('id, title, status, score, category, handling_days_max, delivery_days_max')
      .not('handling_days_max', 'is', null)
      .gt('delivery_days_max', 6)
      .neq('status', 'Disabled')
      .limit(20),
    supabase.from('products')
      .select('id, title, status, score, category')
      .eq('tracking_supported', false)
      .neq('status', 'Disabled')
      .limit(20),
    supabase.from('products')
      .select('id, title, status, score, category, trademark_risk, restricted, medical_claim_risk')
      .or('trademark_risk.eq.true,restricted.eq.true,medical_claim_risk.eq.true')
      .neq('status', 'Disabled')
      .limit(20),
  ])

  const section = (title: string, count: number, children: React.ReactNode) => (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${count > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
          {count}
        </span>
      </div>
      {count === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-400">All clear.</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Exceptions</h1>
        <p className="mt-1 text-sm text-gray-500">All risky orders and products that need attention</p>
      </div>

      {/* Orders at SLA risk */}
      {section('Orders at SLA Risk', riskOrders?.length ?? 0, (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
              <th className="px-5 py-3 text-left font-medium">Order</th>
              <th className="px-4 py-3 text-left font-medium">Channel</th>
              <th className="px-4 py-3 text-left font-medium">Supplier</th>
              <th className="px-4 py-3 text-left font-medium">Required Ship By</th>
              <th className="px-4 py-3 text-left font-medium">Tracking</th>
              <th className="px-4 py-3 text-left font-medium">Risk</th>
              <th className="px-4 py-3 text-left font-medium">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(riskOrders ?? []).map(order => {
              const risk = evaluateOrderRisk(order)
              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-sky-600 hover:underline">
                      {order.shopify_order_id ?? order.tiktok_order_id ?? order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-500">{order.channel}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {(order.suppliers as { name: string } | null)?.name ?? <span className="text-red-500">No supplier</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(order.required_ship_by_time)}</td>
                  <td className="px-4 py-3">
                    {order.tracking_uploaded
                      ? <span className="text-green-600 text-xs">{order.tracking_number ?? 'Uploaded'}</span>
                      : <span className="text-red-500 text-xs">Missing</span>}
                  </td>
                  <td className="px-4 py-3"><OrderRiskBadge level={order.sla_risk_status} label={risk.label} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{risk.reason}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ))}

      {/* Products missing supplier */}
      {section('Products with No Supplier', noSupplierProducts?.length ?? 0, (
        <ul className="divide-y divide-gray-50">
          {(noSupplierProducts ?? []).map(p => (
            <li key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
              <Link href={`/admin/products/${p.id}`} className="flex-1 text-sm font-medium text-sky-600 hover:underline">{p.title}</Link>
              <ScoreBadge score={p.score} size="sm" />
              <ProductStatusBadge status={p.status} />
            </li>
          ))}
        </ul>
      ))}

      {/* Products with slow delivery */}
      {section('Products with Slow Delivery (>6 days)', slowProducts?.length ?? 0, (
        <ul className="divide-y divide-gray-50">
          {(slowProducts ?? []).map(p => (
            <li key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
              <Link href={`/admin/products/${p.id}`} className="flex-1 text-sm font-medium text-sky-600 hover:underline">{p.title}</Link>
              <span className="text-xs text-orange-600">
                {(p.handling_days_max ?? 0) + (p.delivery_days_max ?? 0)}d estimated
              </span>
              <ProductStatusBadge status={p.status} />
            </li>
          ))}
        </ul>
      ))}

      {/* Products with no tracking */}
      {section('Products with No Tracking', noTrackingProducts?.length ?? 0, (
        <ul className="divide-y divide-gray-50">
          {(noTrackingProducts ?? []).map(p => (
            <li key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
              <Link href={`/admin/products/${p.id}`} className="flex-1 text-sm font-medium text-sky-600 hover:underline">{p.title}</Link>
              <ScoreBadge score={p.score} size="sm" />
              <ProductStatusBadge status={p.status} />
            </li>
          ))}
        </ul>
      ))}

      {/* Compliance risk products */}
      {section('Products with Compliance Risk', complianceRiskProducts?.length ?? 0, (
        <ul className="divide-y divide-gray-50">
          {(complianceRiskProducts ?? []).map(p => (
            <li key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
              <Link href={`/admin/products/${p.id}`} className="flex-1 text-sm font-medium text-sky-600 hover:underline">{p.title}</Link>
              <div className="flex gap-1">
                {p.trademark_risk && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">TM Risk</span>}
                {p.restricted && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Restricted</span>}
                {p.medical_claim_risk && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Medical Claim</span>}
              </div>
              <ProductStatusBadge status={p.status} />
            </li>
          ))}
        </ul>
      ))}
    </div>
  )
}
