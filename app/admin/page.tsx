export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { ProductStatusBadge } from '@/components/admin/ProductStatusBadge'
import { ScoreBadge } from '@/components/admin/ScoreBadge'
import { OrderRiskBadge } from '@/components/admin/OrderRiskBadge'
import { formatMoney } from '@/lib/utils/money'
import { formatDateTime } from '@/lib/utils/dates'
import Link from 'next/link'
import {
  Package,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Truck,
} from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalProducts },
    { count: shopifyApproved },
    { count: tiktokApproved },
    { count: liveProducts },
    { count: ordersAtRisk },
    { count: missingTracking },
    { count: syncErrors },
    { data: recentProducts },
    { data: riskOrders },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('approved_for_shopify', true),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('approved_for_tiktok', true),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'Live'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).in('sla_risk_status', ['orange', 'red']),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tracking_uploaded', false),
    supabase.from('shopify_sync_logs').select('*', { count: 'exact', head: true }).eq('status', 'error'),
    supabase.from('products')
      .select('id, title, status, score, category, approved_for_shopify, approved_for_tiktok, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('orders')
      .select('*')
      .in('sla_risk_status', ['orange', 'red'])
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Products blocked by specific reasons
  const { count: blockedShipping } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('tracking_supported', false)
    .neq('status', 'Disabled')

  const { count: blockedCompliance } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .or('restricted.eq.true,trademark_risk.eq.true,medical_claim_risk.eq.true')
    .neq('status', 'Disabled')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">ViralVault Commerce OS — operations overview</p>
      </div>

      {/* Stat grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStatCard label="Total Products" value={totalProducts ?? 0} icon={Package} />
        <AdminStatCard label="Approved for Shopify" value={shopifyApproved ?? 0} icon={CheckCircle2} variant="success" />
        <AdminStatCard label="Approved for marketplace" value={tiktokApproved ?? 0} icon={TrendingUp} variant="success" />
        <AdminStatCard label="Live Products" value={liveProducts ?? 0} icon={CheckCircle2} variant="success" />
        <AdminStatCard label="Blocked by Shipping" value={blockedShipping ?? 0} icon={Truck} variant="warning" />
        <AdminStatCard label="Blocked by Compliance" value={blockedCompliance ?? 0} icon={AlertTriangle} variant="warning" />
        <AdminStatCard label="Orders at SLA Risk" value={ordersAtRisk ?? 0} icon={AlertTriangle} variant="danger" />
        <AdminStatCard label="Missing Tracking" value={missingTracking ?? 0} icon={XCircle} variant="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent products */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent Products</h2>
            <Link href="/admin/products" className="text-xs text-sky-600 hover:underline">View all</Link>
          </div>
          <ul className="divide-y divide-gray-50">
            {(recentProducts ?? []).map(p => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.category}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ScoreBadge score={p.score} size="sm" />
                    <ProductStatusBadge status={p.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 px-5 py-3">
            <Link href="/admin/products/new" className="text-sm font-medium text-sky-600 hover:underline">
              + Add product
            </Link>
          </div>
        </div>

        {/* Risk orders */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-700">Orders at Risk</h2>
            <Link href="/admin/exceptions" className="text-xs text-sky-600 hover:underline">View all</Link>
          </div>
          {(riskOrders ?? []).length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No orders at risk.
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {(riskOrders ?? []).map(order => (
                <li key={order.id}>
                  <Link href={`/admin/orders/${order.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {order.shopify_order_id ?? order.tiktok_order_id ?? order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.channel} · {order.customer_state ?? 'Unknown state'} · {formatDateTime(order.order_time)}
                      </p>
                    </div>
                    <OrderRiskBadge level={order.sla_risk_status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Sync status */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Sync Status</span>
          </div>
          <Link href="/admin/sync" className="text-xs text-sky-600 hover:underline">View logs</Link>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400">Shopify Errors</p>
            <p className={`text-2xl font-bold ${(syncErrors ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {syncErrors ?? 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Shopify</p>
            <p className="text-sm font-medium text-gray-500">Credentials pending</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">marketplace</p>
            <p className="text-sm font-medium text-gray-500">Credentials pending</p>
          </div>
        </div>
      </div>
    </div>
  )
}
