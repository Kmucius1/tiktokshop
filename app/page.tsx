import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { formatMoney } from '@/lib/utils/money'
import { getDemandLabel, slugify } from '@/lib/utils/product-type'
import { ExternalLink } from 'lucide-react'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiktokshop.art'

export const metadata: Metadata = {
  title: 'TikTokShop.art Finds — Viral finds from across the internet',
  description: 'Curated Amazon affiliate products that are actually worth buying. Viral finds, trending products, real links.',
  openGraph: {
    title: 'TikTokShop.art Finds',
    description: 'Curated viral finds. Real Amazon links. Products worth clicking.',
    url: siteUrl,
    siteName: 'TikTokShop.art Finds',
    type: 'website',
  },
}

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: featuredProducts }, { data: allCategories }] = await Promise.all([
    supabase
      .from('products')
      .select('id, title, slug, category, selling_price, hero_image_url, short_description, monthly_purchases, affiliate_click_count')
      .eq('status', 'Live')
      .or('product_type.eq.amazon_affiliate,category.eq.Amazon Finds')
      .not('hero_image_url', 'is', null)
      .order('affiliate_click_count', { ascending: false })
      .limit(8),
    supabase
      .from('products')
      .select('category')
      .eq('status', 'Live')
      .or('product_type.eq.amazon_affiliate,category.eq.Amazon Finds'),
  ])

  const liveProducts = (featuredProducts ?? []).filter(
    p => p.hero_image_url
  )

  const uniqueCategories = [
    ...new Set((allCategories ?? []).map(p => p.category).filter(Boolean)),
  ].slice(0, 6)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-white">TikTokShop.art</span>
            <span className="rounded bg-pink-500 px-1.5 py-0.5 text-xs font-bold text-white">Finds</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/amazon-finds" className="hidden text-sm font-medium text-zinc-400 hover:text-white md:block">
              Amazon Finds
            </Link>
            <Link
              href="/amazon-finds"
              className="rounded-full bg-pink-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-pink-400"
            >
              Browse All
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-zinc-950 px-4 py-24">
        {/* Glow effects */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-pink-400">
            Independent affiliate curation
          </p>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white md:text-7xl">
            Viral finds from{' '}
            <span className="bg-gradient-to-r from-pink-500 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              across the internet.
            </span>
          </h1>
          <p className="mb-10 text-lg text-zinc-400 md:text-xl">
            Products people actually click. Curated, tracked, and linked directly to Amazon.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/amazon-finds"
              className="rounded-full bg-pink-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-pink-500/25 transition hover:bg-pink-400"
            >
              Browse Amazon Finds →
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="border-y border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center text-xs text-zinc-500">
        TikTokShop.art is an independent site and is not affiliated with TikTok, ByteDance, or Amazon.
        Some links are Amazon affiliate links — we may earn a commission at no extra cost to you.
      </div>

      {/* Trending Now */}
      {liveProducts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-white">
              🔥 Trending Finds
            </h2>
            <Link href="/amazon-finds" className="text-sm font-medium text-pink-400 hover:text-pink-300">
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {liveProducts.slice(0, 8).map(product => {
              const demand = getDemandLabel(product.monthly_purchases)
              return (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden transition hover:border-pink-500/50 hover:shadow-xl hover:shadow-pink-500/10"
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
                      <p className="mt-1 text-xs text-zinc-400 line-clamp-1">{product.short_description}</p>
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
        </section>
      )}

      {/* Collections */}
      <section className="border-t border-zinc-800 bg-zinc-900/30 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Shop by Vibe</h2>
              <p className="mt-1 text-sm text-zinc-500">Curated finds organized by what you actually need</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Home Reset Finds',   slug: 'home-reset-finds',    emoji: '🏠' },
              { label: 'Cleaning Favorites', slug: 'cleaning-favorites',   emoji: '🧹' },
              { label: 'Bathroom Finds',     slug: 'bathroom-finds',       emoji: '🚿' },
              { label: 'Organization Finds', slug: 'organization-finds',   emoji: '📦' },
              { label: 'Kitchen Finds',      slug: 'kitchen-finds',        emoji: '🍳' },
              { label: 'Beauty Finds',       slug: 'beauty-finds',         emoji: '✨' },
              { label: 'Viral Products',     slug: 'viral-products',       emoji: '🔥' },
              { label: 'Best Under $20',     slug: 'best-under-20',        emoji: '💸' },
            ].map(c => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="group flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-5 transition hover:border-pink-500/50 hover:bg-zinc-800 hover:shadow-lg hover:shadow-pink-500/10"
              >
                <span className="text-3xl">{c.emoji}</span>
                <div>
                  <p className="font-bold text-white text-sm leading-snug">{c.label}</p>
                  <p className="mt-0.5 text-xs text-pink-400 transition group-hover:translate-x-0.5">
                    Shop now →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why people click */}
      <section className="border-t border-zinc-800 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-2xl font-extrabold text-white">Why people click</h2>
          <p className="mb-10 text-center text-sm text-zinc-500">How TikTokShop.art Finds works</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                icon: '🔎',
                title: 'We find them',
                body: 'We research trending, viral, and genuinely useful Amazon products so you don\'t have to scroll for hours.',
              },
              {
                icon: '✅',
                title: 'We curate them',
                body: 'Every product is checked for demand, reviews, and quality before it appears here.',
              },
              {
                icon: '🔗',
                title: 'You buy on Amazon',
                body: 'Click "Shop on Amazon" and complete your purchase directly on Amazon. No middleman, no extra cost.',
              },
            ].map(item => (
              <div key={item.title} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <p className="mb-3 text-3xl">{item.icon}</p>
                <p className="mb-2 font-bold text-white">{item.title}</p>
                <p className="text-sm text-zinc-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Amazon Finds CTA */}
      <section className="border-t border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-extrabold text-white">Ready to discover?</h2>
          <p className="mb-8 text-zinc-400">Browse all curated Amazon finds — real products, real links, tracked clicks.</p>
          <Link
            href="/amazon-finds"
            className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-pink-500/25 transition hover:bg-pink-400"
          >
            Browse All Amazon Finds <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 px-4 py-10">
        <div className="mx-auto max-w-6xl flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">TikTokShop.art</span>
            <span className="rounded bg-pink-500 px-1.5 py-0.5 text-xs font-bold text-white">Finds</span>
          </div>
          <p className="text-center text-xs text-zinc-500 max-w-sm">
            Independent affiliate curation site. Not affiliated with TikTok, ByteDance, or Amazon.
            As an Amazon Associate, we may earn from qualifying purchases.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-zinc-500">
            <Link href="/amazon-finds" className="hover:text-zinc-300">Amazon Finds</Link>
            <Link href="/collections/viral-products" className="hover:text-zinc-300">Viral Products</Link>
            <Link href="/collections/best-under-20" className="hover:text-zinc-300">Under $20</Link>
            <Link href="/collections/kitchen-finds" className="hover:text-zinc-300">Kitchen</Link>
            <Link href="/collections/beauty-finds" className="hover:text-zinc-300">Beauty</Link>
            <Link href="/about" className="hover:text-zinc-300">About</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
