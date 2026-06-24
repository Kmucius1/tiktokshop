export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils/dates'
import Link from 'next/link'

export default async function AffiliateAnalyticsPage() {
  const supabase = await createClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalClicks },
    { count: clicksToday },
    { count: clicksWeek },
    { data: clicksByProduct },
    { data: clicksBySource },
    { data: clicksBySection },
    { data: missingLinks },
    { data: zeroClicks },
  ] = await Promise.all([
    supabase.from('affiliate_clicks').select('*', { count: 'exact', head: true }),
    supabase.from('affiliate_clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', todayStart),
    supabase.from('affiliate_clicks').select('*', { count: 'exact', head: true }).gte('clicked_at', weekStart),
    supabase.from('affiliate_clicks').select('product_id').not('product_id', 'is', null),
    supabase.from('affiliate_clicks').select('source_page').not('source_page', 'is', null),
    supabase.from('affiliate_clicks').select('source_section').not('source_section', 'is', null),
    supabase.from('products').select('id, title, category, product_type')
      .eq('product_type', 'amazon_affiliate')
      .is('amazon_affiliate_url', null),
    supabase.from('products').select('id, title, category, affiliate_click_count, amazon_affiliate_url')
      .eq('product_type', 'amazon_affiliate')
      .not('amazon_affiliate_url', 'is', null)
      .eq('affiliate_click_count', 0),
  ])

  // Aggregate clicks by product_id
  const productClickMap: Record<string, number> = {}
  ;(clicksByProduct ?? []).forEach(c => {
    if (c.product_id) productClickMap[c.product_id] = (productClickMap[c.product_id] ?? 0) + 1
  })

  // Aggregate by source page
  const sourcePageMap: Record<string, number> = {}
  ;(clicksBySource ?? []).forEach(c => {
    const page = c.source_page ?? 'direct'
    sourcePageMap[page] = (sourcePageMap[page] ?? 0) + 1
  })

  // Aggregate by source section
  const sectionMap: Record<string, number> = {}
  ;(clicksBySection ?? []).forEach(c => {
    const section = c.source_section ?? 'unknown'
    sectionMap[section] = (sectionMap[section] ?? 0) + 1
  })

  // Get product titles for top clicked
  const topProductIds = Object.entries(productClickMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)

  const { data: topProducts } = topProductIds.length > 0
    ? await supabase.from('products').select('id, title, category, affiliate_click_count').in('id', topProductIds)
    : { data: [] }

  const topProductsSorted = (topProducts ?? []).sort(
    (a, b) => (productClickMap[b.id] ?? 0) - (productClickMap[a.id] ?? 0)
  )

  const statCard = (label: string, value: number | string) => (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Affiliate Click Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            ViralVault click tracking — Amazon purchases and commissions are in your{' '}
            <a href="https://affiliate-program.amazon.com" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
              Amazon Associates reports
            </a>
          </p>
        </div>
        <Link href="/admin/settings/amazon" className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          Amazon Settings
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {statCard('Total Affiliate Clicks', totalClicks ?? 0)}
        {statCard('Clicks Today', clicksToday ?? 0)}
        {statCard('Clicks This Week', clicksWeek ?? 0)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top clicked products */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Top Clicked Products</h2>
          </div>
          {topProductsSorted.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">No clicks yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {topProductsSorted.map(p => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <Link href={`/admin/products/${p.id}`} className="text-sm font-medium text-sky-600 hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-xs text-gray-400">{p.category}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{p.affiliate_click_count} clicks</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Clicks by source section */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">Clicks by Source Section</h2>
          </div>
          {Object.keys(sectionMap).length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">No clicks yet.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {Object.entries(sectionMap).sort((a, b) => b[1] - a[1]).map(([section, count]) => (
                <li key={section} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="text-gray-700">{section}</span>
                  <span className="font-bold text-gray-900">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Products missing affiliate links */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Products Missing Affiliate Links
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{missingLinks?.length ?? 0}</span>
            </h2>
          </div>
          {(missingLinks ?? []).length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">All affiliate products have links.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {(missingLinks ?? []).map(p => (
                <li key={p.id} className="px-5 py-3">
                  <Link href={`/admin/products/${p.id}`} className="text-sm font-medium text-sky-600 hover:underline">
                    {p.title}
                  </Link>
                  <p className="text-xs text-gray-400">{p.category}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Products with zero clicks */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Affiliate Products with Zero Clicks
              <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">{zeroClicks?.length ?? 0}</span>
            </h2>
          </div>
          {(zeroClicks ?? []).length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">All linked products have clicks.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {(zeroClicks ?? []).map(p => (
                <li key={p.id} className="px-5 py-3">
                  <Link href={`/admin/products/${p.id}`} className="text-sm font-medium text-sky-600 hover:underline">
                    {p.title}
                  </Link>
                  <p className="text-xs text-gray-400">{p.category}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
