export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { ProductStatusBadge } from '@/components/admin/ProductStatusBadge'
import { ScoreBadge } from '@/components/admin/ScoreBadge'
import { formatDateTime } from '@/lib/utils/dates'
import Link from 'next/link'
import {
  Package,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Download,
  Hammer,
} from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalProducts },
    { count: readyForTikTok },
    { count: listedProducts },
    { count: needsContent },
    { count: ordersAtRisk },
    { count: missingTracking },
    { data: recentProducts },
    { data: riskOrders },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('listing_status', 'Draft Ready'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('listing_status', 'Listed'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('content_queue_status', 'Needs Script'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).in('sla_risk_status', ['orange', 'red']),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('tracking_uploaded', false),
    supabase.from('products')
      .select('id, title, status, score, category, listing_status, content_queue_status, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('orders')
      .select('*')
      .in('sla_risk_status', ['orange', 'red'])
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const { count: exportedNotListed } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('listing_status', 'Exported')

  const { count: newImports } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Researching')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">TikTokShop.art — product pipeline overview</p>
      </div>

      {/* Stat grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStatCard label="Total Products" value={totalProducts ?? 0} icon={Package} />
        <AdminStatCard label="Ready to Export" value={readyForTikTok ?? 0} icon={Download} variant="success" />
        <AdminStatCard label="Listed on TikTok" value={listedProducts ?? 0} icon={CheckCircle2} variant="success" />
        <AdminStatCard label="New Imports" value={newImports ?? 0} icon={TrendingUp} variant="success" />
        <AdminStatCard label="Exported – Not Listed" value={exportedNotListed ?? 0} icon={Hammer} variant="warning" />
        <AdminStatCard label="Needs Content" value={needsContent ?? 0} icon={AlertTriangle} variant="warning" />
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
            {(recentProducts ?? []).length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-gray-400">
                No products yet.{' '}
                <Link href="/admin/products/import" className="text-sky-600 hover:underline">Import from AutoDS →</Link>
              </li>
            )}
          </ul>
          <div className="border-t border-gray-100 px-5 py-3">
            <Link href="/admin/products/import" className="text-sm font-medium text-sky-600 hover:underline">
              + Import products
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
                        {order.tiktok_order_id ?? order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.channel} · {formatDateTime(order.order_time)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/products/import" className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-500">
            Import from AutoDS
          </Link>
          <Link href="/admin/product-workroom" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Open Workroom
          </Link>
          <Link href="/admin/tiktok/export" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Export to TikTok
          </Link>
          <Link href="/admin/content-queue" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Content Queue
          </Link>
        </div>
      </div>
    </div>
  )
}
