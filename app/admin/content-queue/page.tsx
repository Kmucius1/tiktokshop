export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

const STATUS_COLORS: Record<string, string> = {
  'Not Started':    'bg-gray-100 text-gray-500',
  'Needs Script':   'bg-amber-100 text-amber-700',
  'Script Ready':   'bg-sky-100 text-sky-700',
  'Needs Video':    'bg-violet-100 text-violet-700',
  'Ready to Post':  'bg-green-100 text-green-700',
  'Posted':         'bg-green-600 text-white',
  'Archived':       'bg-gray-100 text-gray-400',
}

export default async function ContentQueuePage() {
  const supabase = await createClient()

  const { data: queue } = await supabase
    .from('product_content_queue')
    .select(`
      id, hook, short_script_15s, short_script_30s, caption, hashtags, cta, ugc_concept, status, platform, updated_at,
      products(id, title, hero_image_url, selling_price, listing_status, tiktok_shop_url)
    `)
    .order('updated_at', { ascending: false })
    .limit(100)

  const statusFilter = ['Needs Script', 'Script Ready', 'Needs Video', 'Ready to Post', 'Posted', 'Archived']

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Queue</h1>
          <p className="mt-1 text-sm text-gray-500">TikTok video scripts and content for all products</p>
        </div>
        <div className="flex gap-2">
          {statusFilter.map(s => (
            <Link key={s} href={`/admin/content-queue?status=${encodeURIComponent(s)}`} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-sky-400">
              {s}
            </Link>
          ))}
        </div>
      </div>

      {(!queue || queue.length === 0) ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-gray-200">
          <p className="text-4xl mb-4">🎬</p>
          <p className="text-lg font-semibold text-gray-700">No content yet</p>
          <p className="mt-2 text-sm text-gray-400 mb-6">Go to a product and click "Generate TikTok Listing" to create content</p>
          <Link href="/admin/products" className="inline-block rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500">
            Go to Products
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {queue.map(item => {
            const product = Array.isArray(item.products) ? item.products[0] : item.products as {
              id: string
              title: string
              hero_image_url: string | null
              selling_price: number | null
              listing_status: string | null
              tiktok_shop_url: string | null
            } | null

            return (
              <div key={item.id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {product?.hero_image_url
                      ? <Image src={product.hero_image_url} alt={product?.title ?? ''} fill className="object-cover" sizes="48px" />
                      : <span className="flex h-full items-center justify-center text-xl">📦</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product?.title ?? '—'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {item.status}
                      </span>
                      {product?.selling_price && (
                        <span className="text-xs text-gray-400">${product.selling_price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  {product?.id && (
                    <Link href={`/admin/products/${product.id}`} className="shrink-0 text-xs text-sky-600 hover:underline">
                      Edit →
                    </Link>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {item.hook && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Hook</p>
                      <p className="text-sm font-semibold text-gray-900 italic">"{item.hook}"</p>
                    </div>
                  )}

                  {item.short_script_15s && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">15s Script</p>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{item.short_script_15s}</p>
                    </div>
                  )}

                  {item.caption && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Caption</p>
                      <p className="text-xs text-gray-700">{item.caption}</p>
                    </div>
                  )}

                  {item.hashtags && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Hashtags</p>
                      <p className="text-xs text-sky-600">{item.hashtags}</p>
                    </div>
                  )}

                  {item.ugc_concept && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">UGC Concept</p>
                      <p className="text-xs text-gray-600 italic">{item.ugc_concept}</p>
                    </div>
                  )}

                  {!item.hook && !item.caption && !item.short_script_15s && (
                    <p className="text-sm text-gray-400 text-center py-2">No content generated yet</p>
                  )}
                </div>

                {/* Footer links */}
                <div className="flex items-center gap-3 border-t border-gray-50 px-4 py-3">
                  {product?.tiktok_shop_url && (
                    <a href={product.tiktok_shop_url} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-600 hover:underline">
                      TikTok Shop →
                    </a>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    Updated {new Date(item.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
