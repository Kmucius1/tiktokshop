import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Star } from 'lucide-react'
import { ShareButtons } from '@/components/ShareButtons'
import { formatMoney } from '@/lib/utils/money'
import { getDemandLabel } from '@/lib/utils/product-type'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiktokshop.art'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: p } = await supabase
    .from('products')
    .select('title, short_description, hero_image_url, seo_title, seo_description, category')
    .eq('slug', slug)
    .eq('status', 'Live')
    .single()

  if (!p) return { title: 'Product Not Found | TikTokShop.art Finds' }

  const title = p.seo_title ?? `${p.title} | TikTokShop.art Finds`
  const description = p.seo_description ?? p.short_description ?? `Shop ${p.title} on Amazon.`
  const canonicalUrl = `${siteUrl}/product/${slug}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: p.title,
      description,
      url: canonicalUrl,
      type: 'article',
      images: p.hero_image_url ? [{ url: p.hero_image_url, alt: p.title }] : [],
      siteName: 'TikTokShop.art Finds',
    },
    twitter: {
      card: 'summary_large_image',
      title: p.title,
      description,
      images: p.hero_image_url ? [p.hero_image_url] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select(`
      id, title, slug, category, short_description, description,
      hero_image_url, selling_price, cta_text, product_type,
      why_trending, best_for, problem_solved, trust_notes, main_benefit,
      best_audience, demand_note, monthly_purchases, amazon_rating,
      amazon_review_count, affiliate_disclosure_enabled
    `)
    .eq('slug', slug)
    .eq('status', 'Live')
    .or('product_type.eq.amazon_affiliate,category.eq.Amazon Finds')
    .single()

  if (!product) notFound()

  const goUrl = `${siteUrl}/go/${product.slug}?from=product`
  const shareUrl = `${siteUrl}/product/${product.slug}`
  const demand = getDemandLabel(product.monthly_purchases)
  const collectionSlug = product.category
    ? product.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : null

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-white">TikTokShop.art</span>
            <span className="rounded bg-pink-500 px-1.5 py-0.5 text-xs font-bold text-white">Finds</span>
          </Link>
          <Link href="/amazon-finds" className="text-sm text-zinc-400 hover:text-white">
            ← All Finds
          </Link>
        </div>
      </nav>

      {/* Disclosure */}
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-center text-xs text-zinc-400">
        TikTokShop.art is independent. Not affiliated with TikTok, ByteDance, or Amazon. Affiliate links — we may earn a commission at no extra cost to you.
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-900">
            {product.hero_image_url ? (
              <Image
                src={product.hero_image_url}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl">🛒</div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {/* Category + breadcrumb */}
            <div className="flex items-center gap-2 mb-3">
              {collectionSlug && (
                <Link
                  href={`/collections/${collectionSlug}`}
                  className="rounded-full bg-pink-500/20 px-3 py-0.5 text-xs font-bold text-pink-400 hover:bg-pink-500/30"
                >
                  {product.category}
                </Link>
              )}
            </div>

            <h1 className="text-2xl font-extrabold leading-tight text-white md:text-3xl">{product.title}</h1>

            {/* Price + rating */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {product.selling_price ? (
                <span className="text-3xl font-bold text-white">{formatMoney(product.selling_price)}</span>
              ) : null}
              {product.amazon_rating ? (
                <div className="flex items-center gap-1 text-sm text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span className="font-semibold">{product.amazon_rating.toFixed(1)}</span>
                  {product.amazon_review_count ? (
                    <span className="text-zinc-400">({product.amazon_review_count.toLocaleString()} reviews)</span>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Demand badge */}
            {demand.variant !== 'unknown' && (
              <div className="mt-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                  demand.variant === 'hot'
                    ? 'bg-pink-500/20 text-pink-400'
                    : demand.variant === 'good'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-zinc-700 text-zinc-400'
                }`}>
                  {demand.variant === 'hot' ? '🔥 ' : demand.variant === 'good' ? '✅ ' : ''}
                  {demand.label}
                </span>
              </div>
            )}

            {/* Short description */}
            {product.short_description && (
              <p className="mt-4 text-zinc-300 leading-relaxed">{product.short_description}</p>
            )}

            {/* Primary CTA */}
            <div className="mt-6">
              <a
                href={goUrl}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-4 text-base font-extrabold text-black shadow-lg transition hover:bg-amber-300"
              >
                <span>{product.cta_text || 'Shop on Amazon'}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <p className="mt-2 text-center text-xs text-zinc-500">
                Opens Amazon · We may earn a commission at no extra cost to you.
              </p>
            </div>

            {/* Share */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">Share this find</p>
              <ShareButtons title={product.title} url={shareUrl} description={product.short_description ?? undefined} />
            </div>

            {/* Trust note */}
            {product.trust_notes && (
              <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
                {product.trust_notes}
              </div>
            )}
          </div>
        </div>

        {/* Content sections */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {product.why_trending && (
            <ContentSection title="Why people click this" icon="🔥">
              {product.why_trending}
            </ContentSection>
          )}
          {product.main_benefit && (
            <ContentSection title="Main benefit" icon="✅">
              {product.main_benefit}
            </ContentSection>
          )}
          {product.best_for && (
            <ContentSection title="Best for" icon="🎯">
              {product.best_for}
            </ContentSection>
          )}
          {product.best_audience && (
            <ContentSection title="Best audience" icon="👥">
              {product.best_audience}
            </ContentSection>
          )}
          {product.problem_solved && (
            <ContentSection title="Problem it solves" icon="💡">
              {product.problem_solved}
            </ContentSection>
          )}
          {product.demand_note && (
            <ContentSection title="Demand insight" icon="📈">
              {product.demand_note}
            </ContentSection>
          )}
          {product.description && (
            <div className="md:col-span-2">
              <ContentSection title="Product details" icon="📦">
                {product.description}
              </ContentSection>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="mb-4 text-lg font-bold text-white">Ready to get it?</p>
          <a
            href={goUrl}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-8 py-4 text-base font-extrabold text-black shadow-lg transition hover:bg-amber-300"
          >
            Shop on Amazon <ExternalLink className="h-4 w-4" />
          </a>
          <p className="mt-3 text-xs text-zinc-500">
            Amazon handles checkout, shipping, and returns.
          </p>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden">
        <a
          href={goUrl}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3.5 text-base font-extrabold text-black"
        >
          Shop on Amazon <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <footer className="border-t border-zinc-800 mt-16 px-4 py-8 pb-20 md:pb-8 text-center">
        <p className="text-xs text-zinc-500 max-w-xl mx-auto">
          TikTokShop.art is an independent affiliate curation site and is not affiliated with TikTok, ByteDance, Amazon, or any listed brands.
          As an Amazon Associate, we may earn from qualifying purchases.
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">Home</Link>
          <Link href="/amazon-finds" className="text-xs text-zinc-500 hover:text-zinc-300">All Finds</Link>
        </div>
      </footer>
    </div>
  )
}

function ContentSection({ title, icon, children }: { title: string; icon: string; children: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
        {icon} {title}
      </p>
      <p className="text-sm leading-relaxed text-zinc-300">{children}</p>
    </div>
  )
}
