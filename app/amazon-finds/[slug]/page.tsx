import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatMoney } from '@/lib/utils/money'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AmazonFindDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, title, slug, category, selling_price, hero_image_url, short_description, description, cta_text, amazon_affiliate_url, amazon_tracking_id, affiliate_disclosure_enabled, product_type, published, why_trending, best_for, problem_solved, trust_notes')
    .eq('slug', slug)
    .eq('product_type', 'amazon_affiliate')
    .eq('published', true)
    .single()

  if (!product) notFound()

  // Click tracking URL — never exposes raw affiliate link to frontend
  const clickUrl = `/api/affiliate/click?product_id=${product.id}&source_section=product_page`

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">ViralVault</span>
            <span className="rounded bg-violet-500 px-1.5 py-0.5 text-xs font-semibold text-white">Finds</span>
          </Link>
          <Link href="/amazon-finds" className="text-sm text-gray-500 hover:text-gray-800">
            ← All Finds
          </Link>
        </div>
      </nav>

      {/* Affiliate disclosure — always shown for Amazon affiliate products */}
      <div className="border-b border-violet-100 bg-violet-50 px-4 py-2.5 text-center text-xs text-violet-700">
        This page contains Amazon affiliate links. As an Amazon Associate, we may earn from qualifying purchases at no extra cost to you.
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Image */}
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-gray-50">
              {product.hero_image_url ? (
                <img
                  src={product.hero_image_url}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-7xl">🛒</div>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <p className="mb-2 text-sm font-medium text-violet-600">{product.category}</p>
            <h1 className="text-3xl font-bold text-gray-900 leading-snug">{product.title}</h1>

            {product.selling_price && (
              <p className="mt-4 text-2xl font-bold text-gray-900">{formatMoney(product.selling_price)}</p>
            )}

            {product.short_description && (
              <p className="mt-4 text-gray-600">{product.short_description}</p>
            )}

            {/* CTA — always routes through click tracker */}
            <div className="mt-6">
              <a
                href={clickUrl}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 py-4 text-base font-bold text-gray-900 shadow transition hover:bg-amber-300"
              >
                <span>View on Amazon</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <p className="mt-2 text-center text-xs text-gray-400">
                You'll be taken to Amazon to complete your purchase.
              </p>
            </div>

            {/* Trust note */}
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              {product.trust_notes ?? 'Amazon handles checkout, shipping, returns, and customer service.'}
            </div>

            {/* Info sections */}
            <div className="mt-6 space-y-3">
              {product.best_for && (
                <details className="rounded-xl border border-gray-100 open:border-gray-200" open>
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-800 list-none">Best For</summary>
                  <p className="px-4 pb-4 text-sm text-gray-600">{product.best_for}</p>
                </details>
              )}

              {product.why_trending && (
                <details className="rounded-xl border border-gray-100 open:border-gray-200">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-800 list-none">Why It's Trending</summary>
                  <p className="px-4 pb-4 text-sm text-gray-600">{product.why_trending}</p>
                </details>
              )}

              {product.problem_solved && (
                <details className="rounded-xl border border-gray-100 open:border-gray-200">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-800 list-none">Problem It Solves</summary>
                  <p className="px-4 pb-4 text-sm text-gray-600">{product.problem_solved}</p>
                </details>
              )}

              {product.description && (
                <details className="rounded-xl border border-gray-100 open:border-gray-200">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-800 list-none">Product Details</summary>
                  <p className="px-4 pb-4 text-sm text-gray-600">{product.description}</p>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-3 md:hidden">
        <a
          href={clickUrl}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 py-4 text-base font-bold text-gray-900"
        >
          View on Amazon <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <footer className="border-t border-gray-100 mt-16 px-4 py-8 pb-24 md:pb-8">
        <p className="text-center text-xs text-gray-400">
          ViralVault · This page contains Amazon affiliate links · As an Amazon Associate we may earn from qualifying purchases
        </p>
      </footer>
    </div>
  )
}
