import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { formatMoney } from '@/lib/utils/money'
import { getDemandLabel, slugify } from '@/lib/utils/product-type'
import { ExternalLink, Flame, TrendingUp, DollarSign, Star } from 'lucide-react'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiktokshop.art'

export const metadata: Metadata = {
  title: 'Amazon Finds | TikTokShop.art — Viral Products Worth Buying',
  description: 'Hand-picked Amazon products that are actually trending. Real links, real reviews, real demand signals.',
  alternates: { canonical: `${siteUrl}/amazon-finds` },
  openGraph: {
    title: 'Amazon Finds | TikTokShop.art',
    description: 'Curated viral finds. Real Amazon links.',
    url: `${siteUrl}/amazon-finds`,
    siteName: 'TikTokShop.art Finds',
  },
}

interface SearchParams {
  sort?: string
  category?: string
}

export default async function AmazonFindsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const sort = params.sort ?? 'popular'
  const categoryFilter = params.category ?? ''

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('id, title, slug, category, selling_price, hero_image_url, short_description, monthly_purchases, affiliate_click_count, amazon_rating, amazon_review_count, amazon_affiliate_url, amazon_product_url, product_type, why_trending')
    .eq('status', 'Live')
    .not('hero_image_url', 'is', null)

  if (categoryFilter) {
    query = query.eq('category', categoryFilter)
  }

  // Sort
  if (sort === 'popular')   query = query.order('affiliate_click_count', { ascending: false })
  else if (sort === 'trending') query = query.order('monthly_purchases', { ascending: false, nullsFirst: false })
  else if (sort === 'price_low') query = query.order('selling_price', { ascending: true, nullsFirst: false })
  else if (sort === 'price_high') query = query.order('selling_price', { ascending: false, nullsFirst: false })
  else if (sort === 'rated') query = query.order('amazon_rating', { ascending: false, nullsFirst: false })
  else query = query.order('affiliate_click_count', { ascending: false })

  const { data: rawProducts } = await query

  const products = (rawProducts ?? []).filter(
    p => p.hero_image_url && (p.amazon_affiliate_url || p.amazon_product_url)
  )

  // Fetch unique categories for filter
  const { data: catRows } = await supabase
    .from('products')
    .select('category')
    .eq('status', 'Live')
    .not('hero_image_url', 'is', null)

  const categories = [...new Set((catRows ?? []).map(r => r.category).filter(Boolean))]

  const sortOptions = [
    { value: 'popular',    label: 'Most Popular',   icon: Flame },
    { value: 'trending',   label: 'Trending',        icon: TrendingUp },
    { value: 'price_low',  label: 'Price: Low–High', icon: DollarSign },
    { value: 'price_high', label: 'Price: High–Low', icon: DollarSign },
    { value: 'rated',      label: 'Top Rated',       icon: Star },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-white">TikTokShop.art</span>
            <span className="rounded bg-pink-500 px-1.5 py-0.5 text-xs font-bold text-white">Finds</span>
          </Link>
          <span className="text-sm text-zinc-400">{products.length} curated finds</span>
        </div>
      </nav>

      {/* Disclosure */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-2.5 text-center text-xs text-zinc-500">
        Independent curation. Not affiliated with TikTok, ByteDance, or Amazon. Affiliate links — we may earn a commission.
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-white">Amazon Finds</h1>
          <p className="mt-1.5 text-zinc-400">Hand-picked viral products. Every link goes directly to Amazon.</p>
        </div>

        {/* Filters + Sort */}
        <div className="mb-8 space-y-4">
          {/* Sort tabs */}
          <div className="flex flex-wrap gap-2">
            {sortOptions.map(({ value, label, icon: Icon }) => (
              <Link
                key={value}
                href={`/amazon-finds?sort=${value}${categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ''}`}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  sort === value
                    ? 'bg-pink-500 text-white'
                    : 'border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-pink-500/50 hover:text-white'
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </Link>
            ))}
          </div>

          {/* Category filter */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/amazon-finds?sort=${sort}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  !categoryFilter ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                All
              </Link>
              {categories.map(cat => (
                <Link
                  key={cat}
                  href={`/amazon-finds?sort=${sort}&category=${encodeURIComponent(cat)}`}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    categoryFilter === cat
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        {products.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 py-24 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-semibold text-zinc-300">Finds coming soon</p>
            <p className="mt-2 text-sm text-zinc-500">We're curating the first batch. Check back shortly.</p>
            <Link href="/" className="mt-6 inline-block rounded-full bg-pink-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-pink-400">
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product, i) => {
              const demand = getDemandLabel(product.monthly_purchases)
              const goUrl = `${siteUrl}/go/${product.slug}?from=listing`
              const isHot = demand.variant === 'hot' || (product.affiliate_click_count ?? 0) > 20

              return (
                <div
                  key={product.id}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden transition hover:border-pink-500/50 hover:shadow-xl hover:shadow-pink-500/10"
                >
                  <Link href={`/product/${product.slug}`} className="block">
                    <div className="relative aspect-square overflow-hidden bg-zinc-800">
                      <Image
                        src={product.hero_image_url!}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        priority={i < 4}
                      />
                      {isHot && (
                        <span className="absolute left-2 top-2 rounded-full bg-pink-500 px-2 py-0.5 text-xs font-bold text-white shadow">
                          🔥 Hot
                        </span>
                      )}
                      {!isHot && demand.variant === 'good' && (
                        <span className="absolute left-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                          ✅ Popular
                        </span>
                      )}
                    </div>

                    <div className="p-3">
                      <p className="text-xs font-semibold text-pink-400">{product.category}</p>
                      <p className="mt-1 text-sm font-bold text-white leading-snug line-clamp-2">{product.title}</p>

                      {product.amazon_rating && (
                        <div className="mt-1 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-semibold text-amber-400">{product.amazon_rating.toFixed(1)}</span>
                          {product.amazon_review_count && (
                            <span className="text-xs text-zinc-500">({product.amazon_review_count.toLocaleString()})</span>
                          )}
                        </div>
                      )}

                      {product.short_description && (
                        <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{product.short_description}</p>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        {product.selling_price ? (
                          <span className="text-sm font-bold text-white">{formatMoney(product.selling_price)}</span>
                        ) : <span />}
                        {demand.variant !== 'unknown' && demand.variant !== 'good' && (
                          <span className="text-xs text-zinc-500">{demand.label}</span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Direct buy CTA on card */}
                  <div className="px-3 pb-3">
                    <a
                      href={goUrl}
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-amber-400 py-2 text-xs font-extrabold text-black transition hover:bg-amber-300 active:scale-[0.98]"
                    >
                      Shop on Amazon <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Collections strip */}
      <div className="border-t border-zinc-800 bg-zinc-900/40 px-4 py-8 mt-8">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Browse by Category</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '🏠 Home Reset',    slug: 'home-reset-finds' },
              { label: '🧹 Cleaning',      slug: 'cleaning-favorites' },
              { label: '🚿 Bathroom',      slug: 'bathroom-finds' },
              { label: '📦 Organization', slug: 'organization-finds' },
              { label: '🍳 Kitchen',       slug: 'kitchen-finds' },
              { label: '✨ Beauty',        slug: 'beauty-finds' },
              { label: '🔥 Viral',         slug: 'viral-products' },
              { label: '💸 Under $20',     slug: 'best-under-20' },
            ].map(c => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-pink-500/50 hover:text-white"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-zinc-800 px-4 py-8 text-center">
        <p className="text-xs text-zinc-500 max-w-xl mx-auto">
          TikTokShop.art is an independent affiliate curation site. Not affiliated with TikTok, ByteDance, or Amazon.
          As an Amazon Associate, we may earn from qualifying purchases.
        </p>
      </footer>
    </div>
  )
}
