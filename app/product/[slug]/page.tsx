import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Star, ShieldCheck, RotateCcw, Truck, Zap } from 'lucide-react'
import { ShareButtons } from '@/components/ShareButtons'
import { formatMoney } from '@/lib/utils/money'
import { getDemandLabel, slugify } from '@/lib/utils/product-type'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiktokshop.art'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: p } = await supabase
    .from('products')
    .select('title, short_description, hero_image_url, seo_title, seo_description, category, selling_price')
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
      hero_image_url, gallery_urls, selling_price, cta_text, product_type,
      why_trending, best_for, problem_solved, trust_notes, main_benefit,
      best_audience, demand_note, monthly_purchases, amazon_rating,
      amazon_review_count, affiliate_disclosure_enabled, affiliate_click_count,
      tiktok_hooks, tiktok_shop_url
    `)
    .eq('slug', slug)
    .eq('status', 'Live')
    .single()

  if (!product) notFound()

  const goUrl = `${siteUrl}/go/${product.slug}?from=product`
  const shareUrl = `${siteUrl}/product/${product.slug}`
  const demand = getDemandLabel(product.monthly_purchases)
  const collectionSlug = product.category
    ? slugify(product.category)
    : null

  // Related products — same category, exclude current
  const { data: related } = await supabase
    .from('products')
    .select('id, title, slug, selling_price, hero_image_url, short_description, monthly_purchases')
    .eq('status', 'Live')
    .eq('category', product.category)
    .neq('slug', slug)
    .not('hero_image_url', 'is', null)
    .order('affiliate_click_count', { ascending: false })
    .limit(4)

  // All gallery images (hero + extras)
  const allImages = [
    product.hero_image_url,
    ...(product.gallery_urls ?? []),
  ].filter(Boolean) as string[]

  // JSON-LD Product schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.short_description ?? product.description ?? '',
    image: allImages,
    url: `${siteUrl}/product/${slug}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: product.selling_price?.toFixed(2) ?? '0',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Amazon' },
    },
    ...(product.amazon_rating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.amazon_rating,
        reviewCount: product.amazon_review_count ?? 1,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  }

  // Urgency signal: show click count as "people interested"
  const hotSignal = (product.affiliate_click_count ?? 0) > 20 || demand.variant === 'hot'
  const trendingHook = (product.tiktok_hooks as string[] | null)?.[0] ?? product.why_trending

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
        Not affiliated with TikTok, ByteDance, or Amazon. Affiliate links — we may earn a commission at no extra cost to you.
      </div>

      {/* Urgency banner */}
      {hotSignal && (
        <div className="bg-pink-600/20 border-b border-pink-500/30 px-4 py-2 text-center text-xs font-semibold text-pink-300">
          🔥 Trending right now — people are buying this
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-900">
              {allImages[0] ? (
                <Image
                  src={allImages[0]}
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
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.slice(1, 5).map((img, i) => (
                  <div key={i} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                    <Image src={img} alt={`${product.title} view ${i + 2}`} fill className="object-cover" sizes="64px" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {/* Category breadcrumb */}
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

            {/* TikTok hook */}
            {trendingHook && (
              <p className="mt-3 text-sm font-semibold text-pink-400 italic">"{trendingHook}"</p>
            )}

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

            {/* Demand badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              {demand.variant !== 'unknown' && (
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                  demand.variant === 'hot' ? 'bg-pink-500/20 text-pink-400' :
                  demand.variant === 'good' ? 'bg-green-500/20 text-green-400' :
                  'bg-zinc-700 text-zinc-400'
                }`}>
                  {demand.variant === 'hot' ? '🔥' : demand.variant === 'good' ? '✅' : ''} {demand.label}
                </span>
              )}
              {(product.affiliate_click_count ?? 0) > 10 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-400">
                  <Zap className="h-3 w-3" /> {product.affiliate_click_count}+ people clicked
                </span>
              )}
            </div>

            {/* Short description */}
            {product.short_description && (
              <p className="mt-4 text-zinc-300 leading-relaxed">{product.short_description}</p>
            )}

            {/* Trust row */}
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                { icon: ShieldCheck, label: 'Amazon checkout' },
                { icon: RotateCcw, label: 'Amazon returns' },
                { icon: Truck, label: 'Amazon shipping' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
                  <Icon className="h-3 w-3 text-green-400" />
                  {label}
                </div>
              ))}
            </div>

            {/* Primary CTA */}
            <div className="mt-6">
              <a
                href={goUrl}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-4 text-base font-extrabold text-black shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 active:scale-[0.98]"
              >
                <span>{product.cta_text || 'Shop on Amazon'}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <p className="mt-2 text-center text-xs text-zinc-500">
                Opens Amazon · Secure checkout · We may earn a commission at no extra cost to you.
              </p>
            </div>

            {/* TikTok Shop link */}
            {product.tiktok_shop_url && (
              <a
                href={product.tiktok_shop_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 py-3.5 text-sm font-bold text-white transition hover:border-pink-500/50 hover:bg-zinc-800"
              >
                <span>🛍 Shop on TikTok Shop</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            {/* Share */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">Share this find</p>
              <ShareButtons title={product.title} url={shareUrl} description={product.short_description ?? undefined} />
            </div>
          </div>
        </div>

        {/* Why buy — content sections */}
        {(product.why_trending || product.main_benefit || product.problem_solved || product.best_for || product.best_audience || product.demand_note || product.description) && (
          <div className="mt-12">
            <h2 className="mb-6 text-xl font-extrabold text-white">Why people love this</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {product.why_trending && <ContentCard icon="🔥" title="Why it's trending" body={product.why_trending} />}
              {product.main_benefit && <ContentCard icon="✅" title="Main benefit" body={product.main_benefit} />}
              {product.problem_solved && <ContentCard icon="💡" title="Problem it solves" body={product.problem_solved} />}
              {product.best_for && <ContentCard icon="🎯" title="Best for" body={product.best_for} />}
              {product.best_audience && <ContentCard icon="👥" title="Best audience" body={product.best_audience} />}
              {product.demand_note && <ContentCard icon="📈" title="Demand insight" body={product.demand_note} />}
              {product.description && (
                <div className="md:col-span-2">
                  <ContentCard icon="📦" title="Product details" body={product.description} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trust note */}
        {product.trust_notes && (
          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4">
            <p className="text-sm text-zinc-400">{product.trust_notes}</p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 text-center">
          <p className="mb-2 text-lg font-extrabold text-white">Ready to get it?</p>
          <p className="mb-6 text-sm text-zinc-400">Ships from Amazon. Returns handled by Amazon.</p>
          <a
            href={goUrl}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-10 py-4 text-base font-extrabold text-black shadow-lg shadow-amber-400/20 transition hover:bg-amber-300"
          >
            Shop on Amazon <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Related products */}
        {(related ?? []).length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-xl font-extrabold text-white">More {product.category} Finds</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {(related ?? []).map(r => {
                const relDemand = getDemandLabel(r.monthly_purchases)
                return (
                  <Link
                    key={r.id}
                    href={`/product/${r.slug}`}
                    className="group rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden transition hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10"
                  >
                    <div className="relative aspect-square overflow-hidden bg-zinc-800">
                      <Image
                        src={r.hero_image_url!}
                        alt={r.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      {relDemand.variant === 'hot' && (
                        <span className="absolute left-2 top-2 rounded-full bg-pink-500 px-2 py-0.5 text-xs font-bold text-white">🔥</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-white leading-snug line-clamp-2">{r.title}</p>
                      <div className="mt-2 flex items-center justify-between">
                        {r.selling_price ? (
                          <span className="text-sm font-bold text-white">{formatMoney(r.selling_price)}</span>
                        ) : <span />}
                        <span className="text-xs font-bold text-amber-400">Amazon →</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950/98 px-4 py-3 backdrop-blur md:hidden">
        <a
          href={goUrl}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-4 text-base font-extrabold text-black shadow-lg"
        >
          {product.selling_price ? formatMoney(product.selling_price) + ' · ' : ''}Shop on Amazon <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <footer className="border-t border-zinc-800 mt-8 px-4 pb-28 pt-8 text-center md:pb-8">
        <p className="text-xs text-zinc-500 max-w-xl mx-auto">
          TikTokShop.art is an independent affiliate curation site and is not affiliated with TikTok, ByteDance, Amazon, or any listed brands.
          As an Amazon Associate, we may earn from qualifying purchases.
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">Home</Link>
          <Link href="/amazon-finds" className="text-xs text-zinc-500 hover:text-zinc-300">All Finds</Link>
          {collectionSlug && (
            <Link href={`/collections/${collectionSlug}`} className="text-xs text-zinc-500 hover:text-zinc-300">{product.category}</Link>
          )}
        </div>
      </footer>
    </div>
  )
}

function ContentCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">{icon} {title}</p>
      <p className="text-sm leading-relaxed text-zinc-300">{body}</p>
    </div>
  )
}
