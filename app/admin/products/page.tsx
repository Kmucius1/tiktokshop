export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Upload, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface SearchParams {
  status?: string
  listing?: string
  content?: string
  q?: string
  flag?: string
}

function MarginBadge({ margin }: { margin: number | null }) {
  if (margin === null) return <span className="text-xs text-gray-300">—</span>
  const color = margin >= 40 ? 'text-green-700 bg-green-50' : margin >= 20 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{margin.toFixed(0)}%</span>
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Researching': 'bg-gray-400',
    'Needs Review': 'bg-amber-400',
    'Ready for TikTok': 'bg-sky-500',
    'Exported': 'bg-violet-500',
    'Live': 'bg-green-500',
    'Listed': 'bg-green-600',
    'Error': 'bg-red-500',
    'Archived': 'bg-gray-200',
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-600">
      <span className={`h-2 w-2 rounded-full ${colors[status] ?? 'bg-gray-300'}`} />
      {status}
    </span>
  )
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(`
      id, title, slug, category, status, listing_status, content_queue_status,
      selling_price, landed_cost, shipping_cost, margin_percent, inventory,
      source_platform, hero_image_url, created_at, tiktok_ready,
      tiktok_listings(listing_status)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (params.status)  query = query.eq('status', params.status)
  if (params.listing) query = query.eq('listing_status', params.listing)
  if (params.content) query = query.eq('content_queue_status', params.content)
  if (params.q)       query = query.ilike('title', `%${params.q}%`)

  if (params.flag === 'low_margin') {
    query = query.lt('margin_percent', 30).not('margin_percent', 'is', null)
  } else if (params.flag === 'no_image') {
    query = query.is('hero_image_url', null)
  } else if (params.flag === 'no_price') {
    query = query.is('selling_price', null)
  } else if (params.flag === 'no_inventory') {
    query = query.is('inventory', null)
  }

  const { data: products } = await query

  const statuses = ['Researching', 'Needs Review', 'Ready for TikTok', 'Exported', 'Listed', 'Error', 'Archived']
  const listingStatuses = ['Not Prepared', 'Draft Ready', 'Exported', 'Uploaded', 'Listed', 'Rejected', 'Error']
  const flags = [
    { value: 'low_margin',   label: 'Low Margin' },
    { value: 'no_image',     label: 'Missing Image' },
    { value: 'no_price',     label: 'No Price' },
    { value: 'no_inventory', label: 'No Inventory' },
  ]

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">{products?.length ?? 0} products</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products/import" className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Upload className="h-4 w-4" /> Import CSV/XLSX
          </Link>
          <Link href="/admin/products/new" className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form method="get" className="mb-6 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search products…"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <select name="status" defaultValue={params.status} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="listing" defaultValue={params.listing} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none">
          <option value="">All Listing Statuses</option>
          {listingStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="flag" defaultValue={params.flag} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none">
          <option value="">No Flag Filter</option>
          {flags.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">Filter</button>
        <Link href="/admin/products" className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50">Clear</Link>
      </form>

      {/* Quick-filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { label: 'All',              href: '/admin/products' },
          { label: 'Needs Review',     href: '/admin/products?status=Needs+Review' },
          { label: 'Ready for TikTok', href: '/admin/products?status=Ready+for+TikTok' },
          { label: 'Not Prepared',     href: '/admin/products?listing=Not+Prepared' },
          { label: 'Draft Ready',      href: '/admin/products?listing=Draft+Ready' },
          { label: 'Low Margin',       href: '/admin/products?flag=low_margin' },
          { label: 'Missing Image',    href: '/admin/products?flag=no_image' },
        ].map(tab => (
          <Link key={tab.label} href={tab.href} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:border-sky-400 hover:text-sky-600">
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Product cards */}
      {(products ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-lg font-semibold text-gray-700">No products yet</p>
          <p className="mt-2 text-sm text-gray-400 mb-6">Import from AutoDS or add manually</p>
          <Link href="/admin/products/import" className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500">
            <Upload className="h-4 w-4" /> Import Products
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(products ?? []).map(p => {
            const margin = p.margin_percent ?? (
              p.selling_price && p.landed_cost
                ? ((p.selling_price - p.landed_cost - (p.shipping_cost ?? 0)) / p.selling_price) * 100
                : null
            )
            const tiktokListing = Array.isArray(p.tiktok_listings) ? p.tiktok_listings[0] : p.tiktok_listings
            const listingStatus = (tiktokListing as { listing_status?: string } | null)?.listing_status ?? p.listing_status ?? 'Not Prepared'

            return (
              <Link key={p.id} href={`/admin/products/${p.id}`} className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-sky-300 hover:shadow-md transition">
                {/* Image */}
                <div className="relative aspect-square bg-gray-100">
                  {p.hero_image_url ? (
                    <Image src={p.hero_image_url} alt={p.title} fill className="object-cover" sizes="300px" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-gray-200">📦</div>
                  )}
                  {/* Status badge */}
                  <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                    listingStatus === 'Listed'     ? 'bg-green-500 text-white' :
                    listingStatus === 'Draft Ready'? 'bg-sky-500 text-white' :
                    listingStatus === 'Exported'   ? 'bg-violet-500 text-white' :
                    listingStatus === 'Error'      ? 'bg-red-500 text-white' :
                    'bg-gray-800/60 text-white'
                  }`}>
                    {listingStatus}
                  </span>
                </div>

                <div className="p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{p.category ?? p.source_platform ?? '—'}</p>
                  <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-sky-700">{p.title}</p>

                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{p.selling_price ? `$${p.selling_price.toFixed(2)}` : '—'}</p>
                      {p.landed_cost ? <p className="text-xs text-gray-400">Cost ${p.landed_cost.toFixed(2)}</p> : null}
                    </div>
                    <MarginBadge margin={margin} />
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <StatusDot status={p.status} />
                    <div className="flex items-center gap-1">
                      {p.inventory !== null ? (
                        <span className="text-xs text-gray-400">{p.inventory} in stock</span>
                      ) : (
                        <span className="text-xs text-red-400">No qty</span>
                      )}
                    </div>
                  </div>

                  {/* Content status */}
                  <div className="mt-2 border-t border-gray-50 pt-2">
                    <div className="flex items-center gap-1.5">
                      {p.content_queue_status === 'Script Ready' || p.content_queue_status === 'Ready to Post' ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : p.content_queue_status === 'Not Started' ? (
                        <Clock className="h-3 w-3 text-gray-300" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-amber-400" />
                      )}
                      <span className="text-xs text-gray-400">{p.content_queue_status ?? 'No content'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Bottom actions */}
      {(products ?? []).length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3 border-t border-gray-100 pt-6">
          <Link href="/admin/tiktok/export" className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500">
            Export to TikTok →
          </Link>
          <Link href="/admin/product-workroom" className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Open Workroom
          </Link>
          <Link href="/admin/content-queue" className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Content Queue
          </Link>
        </div>
      )}
    </div>
  )
}
