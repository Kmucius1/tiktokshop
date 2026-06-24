export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { ProductStatusBadge } from '@/components/admin/ProductStatusBadge'
import { formatPercent } from '@/lib/utils/money'
import { isAffiliateProduct } from '@/lib/utils/product-type'
import Link from 'next/link'
import { Plus, CheckCircle2, XCircle } from 'lucide-react'
import type { ProductStatus } from '@/types/supabase'

interface SearchParams {
  status?: string
  category?: string
  tiktok?: string
  type?: string
  q?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(`
      id, title, slug, category, status, score, product_type,
      approved_for_tiktok, approved_to_scale,
      selling_price, landed_cost, shipping_cost, margin_percent,
      warehouse_country, tracking_supported, tracking_carrier,
      handling_days_max, delivery_days_max,
      trademark_risk, restricted, battery, child_product,
      primary_supplier_id,
      suppliers(name, approved, risk_level)
    `)
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.category) query = query.eq('category', params.category)
  if (params.type === 'affiliate') query = query.eq('product_type', 'amazon_affiliate')
  if (params.type === 'dropship') query = query.neq('product_type', 'amazon_affiliate')
  if (params.tiktok === 'true') query = query.eq('approved_for_tiktok', true)
  if (params.tiktok === 'false') query = query.eq('approved_for_tiktok', false)
  if (params.q) query = query.ilike('title', `%${params.q}%`)

  const { data: products, error } = await query

  const { data: categories } = await supabase
    .from('products')
    .select('category')

  const uniqueCategories = [...new Set((categories ?? []).map(c => c.category))]

  const statuses: ProductStatus[] = [
    'Researching', 'Supplier Review', 'Shipping Review', 'Compliance Review',
    'Test Order Required', 'Approved for TikTok Shop',
    'Live', 'Scaling', 'Paused', 'Disabled',
  ]

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">{products?.length ?? 0} products in system</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <form method="get" className="flex flex-wrap gap-3">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search products..."
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <select
            name="type"
            defaultValue={params.type}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="affiliate">Affiliate</option>
            <option value="dropship">Dropship</option>
          </select>
          <select
            name="status"
            defaultValue={params.status}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            name="category"
            defaultValue={params.category}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            name="tiktok"
            defaultValue={params.tiktok}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">TikTok: All</option>
            <option value="true">Approved</option>
            <option value="false">Not Approved</option>
          </select>
          <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">
            Filter
          </button>
          <Link href="/admin/products" className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Clear
          </Link>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-5 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Supplier / Score</th>
                <th className="px-4 py-3 text-left font-medium">Warehouse</th>
                <th className="px-4 py-3 text-left font-medium">Delivery</th>
                <th className="px-4 py-3 text-left font-medium">Margin</th>
                <th className="px-4 py-3 text-left font-medium">TikTok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(products ?? []).map(p => {
                const affiliate = isAffiliateProduct(p)
                const margin = p.selling_price && p.landed_cost
                  ? ((p.selling_price - p.landed_cost - (p.shipping_cost ?? 0)) / p.selling_price) * 100
                  : null
                const supplier = Array.isArray(p.suppliers) ? null : p.suppliers as { name: string; approved: boolean; risk_level: string } | null
                const delivery = p.handling_days_max && p.delivery_days_max
                  ? `${p.handling_days_max + p.delivery_days_max}d est.`
                  : '—'

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-gray-900 hover:text-sky-600">
                        {p.title}
                      </Link>
                      {!affiliate && (
                        <div className="mt-0.5 flex gap-1">
                          {p.trademark_risk && <span className="text-xs text-red-500">⚠ TM</span>}
                          {p.restricted && <span className="text-xs text-red-500">⚠ Restricted</span>}
                          {p.battery && <span className="text-xs text-orange-500">🔋 Battery</span>}
                          {p.child_product && <span className="text-xs text-blue-500">👶 Kids</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {affiliate
                        ? <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">Affiliate</span>
                        : <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Dropship</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3"><ProductStatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      {affiliate ? (
                        <span className="text-xs text-gray-400">Affiliate</span>
                      ) : supplier ? (
                        <div>
                          <p className="text-gray-700">{supplier.name}</p>
                          <p className={`text-xs ${supplier.approved ? 'text-green-600' : 'text-orange-500'}`}>
                            {supplier.approved ? 'Approved' : 'Not approved'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-red-500 text-xs">No supplier</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{affiliate ? '—' : (p.warehouse_country ?? '—')}</td>
                    <td className="px-4 py-3 text-gray-500">{affiliate ? '—' : delivery}</td>
                    <td className="px-4 py-3">
                      {affiliate ? (
                        <span className="text-gray-400 text-xs">N/A</span>
                      ) : margin !== null ? (
                        <span className={margin >= 40 ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                          {formatPercent(margin)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {affiliate ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : p.approved_for_tiktok ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {(products ?? []).length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            No products found. <Link href="/admin/products/new" className="text-sky-600 hover:underline">Add the first product.</Link>
          </div>
        )}
      </div>
    </div>
  )
}
