import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { formatMoney } from '@/lib/utils/money'
import { getDemandLabel } from '@/lib/utils/product-type'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiktokshop.art'

export const metadata: Metadata = {
  title: 'Amazon Finds | TikTokShop.art Finds',
  description: 'Curated, hand-picked Amazon affiliate products worth buying. Viral finds, real links.',
  alternates: { canonical: `${siteUrl}/amazon-finds` },
  openGraph: {
    title: 'Amazon Finds | TikTokShop.art Finds',
    description: 'Curated viral finds. Real Amazon links.',
    url: `${siteUrl}/amazon-finds`,
    siteName: 'TikTokShop.art Finds',
  },
}

export default async function AmazonFindsPage() {
  const supabase = await createClient()

  const { data: rawProducts } = await supabase
    .from('products')
    .select('id, title, slug, category, selling_price, hero_image_url, short_description, monthly_purchases, affiliate_click_count, amazon_affiliate_url, amazon_product_url, product_type')
    .eq('status', 'Live')
    .or('product_type.eq.amazon_affiliate,category.eq.Amazon Finds')
    .not('hero_image_url', 'is', null)
    .order('affiliate_click_count', { ascending: false })

  // Require image + affiliate URL for public display
  const products = (rawProducts ?? []).filter(
    p => p.hero_image_url && (p.amazon_affiliate_url || p.amazon_product_url)
  )

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

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
        TikTokShop.art is independent. Not affiliated with TikTok, ByteDance, or Amazon.
        Some links are Amazon affiliate links — we may earn a commission at no extra cost to you.
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">Amazon Finds</h1>
          <p className="mt-2 text-zinc-400">Hand-picked products. Every link goes directly to Amazon.</p>
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              href="/amazon-finds"
              className="rounded-full bg-pink-500 px-3 py-1.5 text-xs font-bold text-white"
            >
              All
            </Link>
            {categories.map(cat => (
              <Link
                key={cat}
                href={`/collections/${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-pink-500/50 hover:text-white"
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        {products.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 py-24 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-semibold text-zinc-300">Finds coming soon</p>
            <p className="mt-2 text-sm text-zinc-500">We're curating the first batch. Check back shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map(product => {
              const demand = getDemandLabel(product.monthly_purchases)
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden transition hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10"
                >
                  <div className="relative aspect-square overflow-hidden bg-zinc-800">
                    <Image
                      src={product.hero_image_url!}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    {demand.variant === 'hot' && (
                      <span className="absolute left-2 top-2 rounded-full bg-pink-500 px-2 py-0.5 text-xs font-bold text-white shadow">
                        🔥 Hot
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-pink-400">{product.category}</p>
                    <p className="mt-1 text-sm font-bold text-white leading-snug line-clamp-2">{product.title}</p>
                    {product.short_description && (
                      <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{product.short_description}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      {product.selling_price ? (
                        <span className="text-sm font-bold text-white">{formatMoney(product.selling_price)}</span>
                      ) : <span />}
                      <span className="rounded-full bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 text-xs font-bold text-amber-400">
                        Amazon →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-zinc-800 mt-16 px-4 py-8 text-center">
        <p className="text-xs text-zinc-500 max-w-xl mx-auto">
          TikTokShop.art is an independent affiliate curation site. Not affiliated with TikTok, ByteDance, or Amazon.
          As an Amazon Associate, we may earn from qualifying purchases.
        </p>
      </footer>
    </div>
  )
}
