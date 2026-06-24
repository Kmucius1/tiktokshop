'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Loader2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  title: string
  description: string | null
  slug: string
  category: string | null
  hero_image_url: string | null
  supplier_url: string | null
  supplier_sku: string | null
  landed_cost: number | null
  shipping_cost: number | null
  selling_price: number | null
  margin_percent: number | null
  inventory: number | null
  status: string
  listing_status: string | null
  content_queue_status: string | null
  source_platform: string | null
  source_product_id: string | null
  processing_time: number | null
  review_notes: string | null
  tiktok_category: string | null
  imported_at: string | null
  created_at: string
  updated_at: string
}

interface ProductImage {
  id: string
  image_url: string
  sort_order: number
  is_primary: boolean
  alt_text: string | null
}

interface ProductVariant {
  id: string
  variant_name: string
  variant_value: string
  sku: string | null
  cost_price: number | null
  selling_price: number | null
  inventory: number | null
}

interface TikTokListing {
  id: string
  tiktok_title: string | null
  tiktok_description: string | null
  tiktok_category: string | null
  brand: string | null
  price: number | null
  inventory: number | null
  listing_status: string | null
}

interface ContentQueue {
  id: string
  hook: string | null
  short_script_15s: string | null
  short_script_30s: string | null
  caption: string | null
  hashtags: string | null
  cta: string | null
  filming_angle: string | null
  ugc_concept: string | null
  status: string | null
}

interface Props {
  product: Product
  images: ProductImage[]
  variants: ProductVariant[]
  listing: TikTokListing | null
  content: ContentQueue | null
}

const TABS = ['Product Info', 'Pricing', 'Images', 'Variants', 'TikTok Listing', 'Content', 'History'] as const
type Tab = typeof TABS[number]

const STATUS_COLORS: Record<string, string> = {
  Researching: 'bg-gray-100 text-gray-700',
  'Needs Review': 'bg-yellow-100 text-yellow-700',
  'Ready for TikTok': 'bg-blue-100 text-blue-700',
  Exported: 'bg-purple-100 text-purple-700',
  Listed: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
}

export function ProductDetailTabs({ product, images, variants, listing, content }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Product Info')
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const margin = product.selling_price && product.landed_cost
    ? ((product.selling_price - product.landed_cost - (product.shipping_cost ?? 0)) / product.selling_price * 100).toFixed(1)
    : null

  async function saveField(field: string, value: string | number | null) {
    setSaving(true)
    await supabase.from('products').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', product.id)
    setSaving(false)
    router.refresh()
  }

  async function runAI(action: string) {
    setAiLoading(action)
    setAiResult(null)
    try {
      const res = await fetch('/api/admin/ai-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, action }),
      })
      const data = await res.json()
      if (data.result) setAiResult(data.result)
      router.refresh()
    } catch {
      setAiResult('Error — try again')
    }
    setAiLoading(null)
  }

  const field = (label: string, value: string | null | undefined, fieldName: string, type: 'input' | 'textarea' = 'input') => (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          defaultValue={value ?? ''}
          rows={4}
          onBlur={e => saveField(fieldName, e.target.value || null)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
        />
      ) : (
        <input
          type="text"
          defaultValue={value ?? ''}
          onBlur={e => saveField(fieldName, e.target.value || null)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
        />
      )}
    </div>
  )

  const priceField = (label: string, value: number | null | undefined, fieldName: string) => (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-gray-400">$</span>
        <input
          type="number"
          step="0.01"
          defaultValue={value ?? ''}
          onBlur={e => saveField(fieldName, e.target.value ? parseFloat(e.target.value) : null)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
        />
      </div>
    </div>
  )

  const aiBtn = (action: string, label: string) => (
    <button
      key={action}
      onClick={() => runAI(action)}
      disabled={!!aiLoading}
      className="flex items-center gap-1.5 rounded-lg border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-700 hover:bg-pink-100 disabled:opacity-50"
    >
      {aiLoading === action ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
      {label}
    </button>
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/products" className="mb-3 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" /> All Products
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[product.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {product.status}
              </span>
              {product.listing_status && (
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                  {product.listing_status}
                </span>
              )}
              {product.source_platform && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                  {product.source_platform}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-gray-400">Saving…</span>}
            {/* Status update */}
            <select
              defaultValue={product.status}
              onChange={e => saveField('status', e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 focus:border-pink-400 focus:outline-none"
            >
              <option>Researching</option>
              <option>Needs Review</option>
              <option>Ready for TikTok</option>
              <option>Exported</option>
              <option>Listed</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">

        {/* ── Product Info ── */}
        {activeTab === 'Product Info' && (
          <div className="max-w-2xl space-y-1">
            {field('Title', product.title, 'title')}
            {field('Description', product.description, 'description', 'textarea')}
            {field('Category', product.category, 'category')}
            {field('TikTok Category', product.tiktok_category, 'tiktok_category')}
            {field('Supplier URL', product.supplier_url, 'supplier_url')}
            {field('Supplier SKU', product.supplier_sku, 'supplier_sku')}
            {field('Source Platform', product.source_platform, 'source_platform')}
            {field('Source Product ID', product.source_product_id, 'source_product_id')}
            {field('Review Notes', product.review_notes, 'review_notes', 'textarea')}
          </div>
        )}

        {/* ── Pricing ── */}
        {activeTab === 'Pricing' && (
          <div className="max-w-md">
            {priceField('Product Cost (landed)', product.landed_cost, 'landed_cost')}
            {priceField('Shipping Cost', product.shipping_cost, 'shipping_cost')}
            {priceField('Selling Price', product.selling_price, 'selling_price')}
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Calculated Margin</p>
              <p className={`text-2xl font-bold ${margin && parseFloat(margin) > 30 ? 'text-green-600' : margin && parseFloat(margin) > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                {margin ? `${margin}%` : '—'}
              </p>
              {product.selling_price && product.landed_cost && (
                <p className="mt-1 text-xs text-gray-400">
                  Profit: ${(product.selling_price - product.landed_cost - (product.shipping_cost ?? 0)).toFixed(2)} per unit
                </p>
              )}
            </div>
            <div className="mt-4">
              {priceField('Inventory', product.inventory, 'inventory')}
            </div>
            <div className="mt-2">
              {field('Processing Time (days)', product.processing_time?.toString() ?? null, 'processing_time')}
            </div>
            <div className="mt-4 flex gap-2 flex-wrap">
              {aiBtn('suggest_price', 'AI: Suggest Price')}
            </div>
          </div>
        )}

        {/* ── Images ── */}
        {activeTab === 'Images' && (
          <div>
            {images.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400">No images yet.</p>
                <p className="mt-1 text-xs text-gray-400">Images are imported automatically from AutoDS CSV.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {images.map(img => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <Image src={img.image_url} alt={img.alt_text ?? product.title} fill className="object-cover" sizes="200px" />
                    {img.is_primary && (
                      <span className="absolute top-2 left-2 rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">Primary</span>
                    )}
                    <a
                      href={img.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 hidden rounded-full bg-white p-1 shadow group-hover:flex"
                    >
                      <ExternalLink className="h-3 w-3 text-gray-600" />
                    </a>
                  </div>
                ))}
              </div>
            )}
            {product.hero_image_url && (
              <div className="mt-4 py-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Hero Image URL</p>
                <input
                  type="text"
                  defaultValue={product.hero_image_url}
                  onBlur={e => saveField('hero_image_url', e.target.value || null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-pink-400 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* ── Variants ── */}
        {activeTab === 'Variants' && (
          <div>
            {variants.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-400">No variants yet.</p>
                <p className="mt-1 text-xs text-gray-400">Variants are imported from AutoDS CSV when available.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4">Value</th>
                      <th className="pb-3 pr-4">SKU</th>
                      <th className="pb-3 pr-4">Cost</th>
                      <th className="pb-3 pr-4">Price</th>
                      <th className="pb-3">Inventory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {variants.map(v => (
                      <tr key={v.id}>
                        <td className="py-3 pr-4 text-gray-700">{v.variant_name}</td>
                        <td className="py-3 pr-4 font-medium text-gray-900">{v.variant_value}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-gray-500">{v.sku ?? '—'}</td>
                        <td className="py-3 pr-4 text-gray-700">{v.cost_price ? `$${v.cost_price.toFixed(2)}` : '—'}</td>
                        <td className="py-3 pr-4 text-gray-700">{v.selling_price ? `$${v.selling_price.toFixed(2)}` : '—'}</td>
                        <td className="py-3 text-gray-700">{v.inventory ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TikTok Listing ── */}
        {activeTab === 'TikTok Listing' && (
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap gap-2">
              {aiBtn('rewrite_title', 'Rewrite Title')}
              {aiBtn('rewrite_description', 'Rewrite Description')}
              {aiBtn('suggest_category', 'Suggest Category')}
              {aiBtn('flag_risks', 'Flag Risks')}
              {aiBtn('full_tiktok_listing', 'Full Listing (AI)')}
            </div>

            {aiResult && (
              <div className="mb-4 rounded-xl border border-pink-200 bg-pink-50 p-4">
                <p className="text-xs font-semibold text-pink-700 mb-1">AI Result</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{aiResult}</p>
              </div>
            )}

            {listing ? (
              <div className="space-y-1">
                <div className="py-3 border-b border-gray-50">
                  <label className="block text-xs font-medium text-gray-500 mb-1">TikTok Title</label>
                  <input
                    type="text"
                    defaultValue={listing.tiktok_title ?? ''}
                    onBlur={async e => {
                      await supabase.from('tiktok_listings').update({ tiktok_title: e.target.value }).eq('id', listing.id)
                      router.refresh()
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
                  />
                </div>
                <div className="py-3 border-b border-gray-50">
                  <label className="block text-xs font-medium text-gray-500 mb-1">TikTok Description</label>
                  <textarea
                    defaultValue={listing.tiktok_description ?? ''}
                    rows={5}
                    onBlur={async e => {
                      await supabase.from('tiktok_listings').update({ tiktok_description: e.target.value }).eq('id', listing.id)
                      router.refresh()
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
                  />
                </div>
                <div className="py-3 border-b border-gray-50">
                  <label className="block text-xs font-medium text-gray-500 mb-1">TikTok Category</label>
                  <input
                    type="text"
                    defaultValue={listing.tiktok_category ?? ''}
                    onBlur={async e => {
                      await supabase.from('tiktok_listings').update({ tiktok_category: e.target.value }).eq('id', listing.id)
                      router.refresh()
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
                  />
                </div>
                <div className="py-3 border-b border-gray-50">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Brand</label>
                  <input
                    type="text"
                    defaultValue={listing.brand ?? ''}
                    onBlur={async e => {
                      await supabase.from('tiktok_listings').update({ brand: e.target.value }).eq('id', listing.id)
                      router.refresh()
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Listing Status:</span>
                  <span className="font-medium text-gray-900">{listing.listing_status ?? 'Not Prepared'}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400 mb-3">No TikTok listing created yet.</p>
                <button
                  onClick={() => runAI('full_tiktok_listing')}
                  disabled={!!aiLoading}
                  className="rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-500 disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {aiLoading === 'full_tiktok_listing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Full TikTok Listing with AI
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Content ── */}
        {activeTab === 'Content' && (
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap gap-2">
              {aiBtn('generate_hook', 'Generate Hook')}
              {aiBtn('generate_15s_script', 'Write 15s Script')}
              {aiBtn('generate_30s_script', 'Write 30s Script')}
              {aiBtn('generate_caption', 'Caption')}
              {aiBtn('generate_hashtags', 'Hashtags')}
              {aiBtn('generate_ugc_concept', 'UGC Concept')}
            </div>

            {aiResult && (
              <div className="mb-4 rounded-xl border border-pink-200 bg-pink-50 p-4">
                <p className="text-xs font-semibold text-pink-700 mb-1">AI Result</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{aiResult}</p>
              </div>
            )}

            {content ? (
              <div className="space-y-4">
                {[
                  { label: 'Hook', key: 'hook', value: content.hook },
                  { label: '15s Script', key: 'short_script_15s', value: content.short_script_15s },
                  { label: '30s Script', key: 'short_script_30s', value: content.short_script_30s },
                  { label: 'Caption', key: 'caption', value: content.caption },
                  { label: 'Hashtags', key: 'hashtags', value: content.hashtags },
                  { label: 'CTA', key: 'cta', value: content.cta },
                  { label: 'Filming Angle', key: 'filming_angle', value: content.filming_angle },
                  { label: 'UGC Concept', key: 'ugc_concept', value: content.ugc_concept },
                ].map(({ label, key, value }) => (
                  <div key={key} className="py-3 border-b border-gray-50">
                    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                    <textarea
                      defaultValue={value ?? ''}
                      rows={3}
                      onBlur={async e => {
                        await supabase.from('product_content_queue').update({ [key]: e.target.value || null }).eq('id', content.id)
                        router.refresh()
                      }}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400 mb-3">No content created yet.</p>
                <button
                  onClick={() => runAI('generate_hook')}
                  disabled={!!aiLoading}
                  className="rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-500 disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {aiLoading === 'generate_hook' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Hook with AI
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── History ── */}
        {activeTab === 'History' && (
          <div className="max-w-md space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Created</span>
              <span className="text-gray-900">{new Date(product.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Last Updated</span>
              <span className="text-gray-900">{new Date(product.updated_at).toLocaleString()}</span>
            </div>
            {product.imported_at && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Imported At</span>
                <span className="text-gray-900">{new Date(product.imported_at).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Source Platform</span>
              <span className="text-gray-900">{product.source_platform ?? '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Source Product ID</span>
              <span className="font-mono text-xs text-gray-900">{product.source_product_id ?? '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Listing Status</span>
              <span className="text-gray-900">{product.listing_status ?? '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Content Status</span>
              <span className="text-gray-900">{product.content_queue_status ?? '—'}</span>
            </div>
            {product.supplier_url && (
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Supplier URL</span>
                <a href={product.supplier_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-600 hover:underline text-xs">
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
