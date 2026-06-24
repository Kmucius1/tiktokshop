import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatMoney } from '@/lib/utils/money'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, suppliers(name, warehouse_country)')
    .eq('slug', slug)
    .eq('status', 'Live')
    .eq('approved_for_shopify', true)
    .single()

  if (!product) notFound()

  const canShowDelivery = product.tracking_supported && product.estimated_delivery_min && product.estimated_delivery_max

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">ViralVault Co.</Link>
          <Link href="/shop" className="text-sm text-sky-600 hover:underline">← Shop All</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-gray-50">
              {product.hero_image_url ? (
                <img src={product.hero_image_url} alt={product.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-8xl">🌊</div>
              )}
            </div>
          </div>

          {/* Product info */}
          <div>
            <p className="mb-2 text-sm font-medium text-sky-600">{product.category}</p>
            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>

            {/* Price */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-900">{formatMoney(product.selling_price)}</span>
              {product.compare_at_price && product.compare_at_price > (product.selling_price ?? 0) && (
                <span className="text-xl text-gray-400 line-through">{formatMoney(product.compare_at_price)}</span>
              )}
            </div>

            {/* Delivery estimate — only shown if verified */}
            {canShowDelivery ? (
              <div className="mt-4 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
                <p className="text-sm font-semibold text-green-800">
                  Estimated delivery: {product.estimated_delivery_min}–{product.estimated_delivery_max} business days
                </p>
                <p className="text-xs text-green-600 mt-0.5">Includes processing and shipping. Tracking included.</p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-sm text-gray-600">Delivery estimate shown at checkout.</p>
              </div>
            )}

            {/* Add to cart */}
            <div className="mt-6 space-y-3">
              <button className="w-full rounded-full bg-gray-900 py-4 text-base font-bold text-white transition hover:bg-gray-800">
                Add to Cart
              </button>
              <button className="w-full rounded-full border-2 border-gray-900 py-4 text-base font-bold text-gray-900 transition hover:bg-gray-50">
                Buy Now
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-2 gap-2">
              {[
                { icon: '📦', text: 'Fast shipping on verified items' },
                { icon: '🔍', text: 'Tracking on every order' },
                { icon: '↩️', text: 'Easy returns' },
                { icon: '✅', text: 'Verified supplier' },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-2 text-xs text-gray-600">
                  <span>{b.icon}</span> {b.text}
                </div>
              ))}
            </div>

            {/* Accordions */}
            <div className="mt-8 space-y-3">
              {product.description && (
                <details className="rounded-xl border border-gray-100 open:border-gray-200">
                  <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-gray-800">Product Details</summary>
                  <div className="px-5 pb-4 text-sm text-gray-600">{product.description}</div>
                </details>
              )}

              <details className="rounded-xl border border-gray-100 open:border-gray-200">
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-gray-800">Shipping Info</summary>
                <div className="px-5 pb-4 text-sm text-gray-600">
                  {canShowDelivery ? (
                    <p>Estimated delivery: {product.estimated_delivery_min}–{product.estimated_delivery_max} business days from order date. Tracking provided via {product.tracking_carrier ?? 'verified carrier'}.</p>
                  ) : (
                    <p>Shipping estimates are shown at checkout after your address is entered. Tracking is included on all orders.</p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">Ships from verified supplier warehouse. Fast shipping shown only for verified, approved products.</p>
                </div>
              </details>

              <details className="rounded-xl border border-gray-100 open:border-gray-200">
                <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-gray-800">Returns</summary>
                <div className="px-5 pb-4 text-sm text-gray-600">
                  <p>We accept returns within 30 days of delivery for most items in original condition. <Link href="/returns-policy" className="text-sky-600 hover:underline">View full policy.</Link></p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-3 md:hidden">
        <button className="w-full rounded-full bg-gray-900 py-4 text-base font-bold text-white">
          Add to Cart — {formatMoney(product.selling_price)}
        </button>
      </div>
    </div>
  )
}
