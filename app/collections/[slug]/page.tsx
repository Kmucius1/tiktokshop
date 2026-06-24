import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatMoney } from '@/lib/utils/money'
import { getDemandLabel, slugify } from '@/lib/utils/product-type'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiktokshop.art'

interface Props {
  params: Promise<{ slug: string }>
}

async function getCollectionData(categorySlug: string) {
  const supabase = await createClient()

  const { data: allProducts } = await supabase
    .from('products')
    .select('category')
    .eq('status', 'Live')
    .or('product_type.eq.amazon_affiliate,category.eq.Amazon Finds')

  const uniqueCategories = [...new Set((allProducts ?? []).map(p => p.category).filter(Boolean))]
  const matchedCategory = uniqueCategories.find(c => slugify(c) === categorySlug)
  if (!matchedCategory) return null

  const { data: products } = await supabase
    .from('products')
    .select('id, title, slug, category, selling_price, hero_image_url, short_description, monthly_purchases, affiliate_click_count')
    .eq('status', 'Live')
    .eq('category', matchedCategory)
    .not('hero_image_url', 'is', null)
    .or('amazon_affiliate_url.not.is.null,amazon_product_url.not.is.null')
    .order('affiliate_click_count', { ascending: false })

  return { category: matchedCategory, products: products ?? [] }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getCollectionData(slug)
  if (!data) return { title: 'Collection Not Found | TikTokShop.art Finds' }

  const title = `${data.category} | TikTokShop.art Finds`
  const description = `Shop curated ${data.category} finds on Amazon. ${data.products.length} products curated and tracked.`

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/collections/${slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/collections/${slug}`,
      siteName: 'TikTokShop.art Finds',
    },
  }
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params
  const data = await getCollectionData(slug)
  if (!data) notFound()

  const { category, products } = data

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-white">TikTokShop.art</span>
            <span className="rounded bg-pink-500 px-1.5 py-0.5 text-xs font-bold text-white">Finds</span>
          </Link>
          <Link href="/amazon-finds" className="text-sm text-zinc-400 hover:text-white">All Finds</Link>
        </div>
      </nav>

      {/* Header */}
      <div className="border-b border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-widest text-pink-500 mb-2">Collection</p>
          <h1 className="text-4xl font-extrabold text-white">{category}</h1>
          <p className="mt-2 text-zinc-400">{products.length} curated finds on Amazon</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 py-24 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-semibold text-zinc-300">No finds in this collection yet</p>
            <Link href="/amazon-finds" className="mt-4 inline-block text-sm text-pink-400 hover:underline">
              See all finds →
            </Link>
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
                    {product.hero_image_url ? (
                      <Image
                        src={product.hero_image_url}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl">🛒</div>
                    )}
                    {demand.variant === 'hot' && (
                      <span className="absolute left-2 top-2 rounded-full bg-pink-500 px-2 py-0.5 text-xs font-bold text-white">
                        🔥 Hot
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{product.title}</p>
                    {product.short_description && (
                      <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{product.short_description}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      {product.selling_price ? (
                        <span className="text-sm font-bold text-white">{formatMoney(product.selling_price)}</span>
                      ) : <span />}
                      <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-400">
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

      <footer className="border-t border-zinc-800 mt-12 px-4 py-8 text-center">
        <p className="text-xs text-zinc-500 max-w-xl mx-auto">
          TikTokShop.art is an independent affiliate curation site. Not affiliated with TikTok, ByteDance, or Amazon.
          As an Amazon Associate, we may earn from qualifying purchases.
        </p>
      </footer>
    </div>
  )
}
