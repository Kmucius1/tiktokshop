import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatMoney } from '@/lib/utils/money'

export default async function ShopAllPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, title, slug, category, selling_price, compare_at_price, hero_image_url, estimated_delivery_min, estimated_delivery_max')
    .eq('status', 'Live')
    .eq('approved_for_shopify', true)
    .order('score', { ascending: false })

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Shop All Summer Finds</h1>
          <Link href="/" className="text-sm text-sky-600 hover:underline">← Back to home</Link>
        </div>

        {(products ?? []).length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center">
            <p className="text-4xl">🌊</p>
            <p className="mt-4 text-lg font-semibold text-gray-700">Products coming soon</p>
            <p className="mt-2 text-sm text-gray-400">Our team is verifying products now. Check back shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {(products ?? []).map(product => (
              <Link
                key={product.id}
                href={`/shop/products/${product.slug}`}
                className="group rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-gray-50">
                  {product.hero_image_url ? (
                    <img src={product.hero_image_url} alt={product.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">🌊</div>
                  )}
                  {product.selling_price && product.selling_price < 25 && (
                    <span className="absolute left-2 top-2 rounded-full bg-sky-500 px-2.5 py-1 text-xs font-bold text-white">Under $25</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-sky-600">{product.category}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{product.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-base font-bold text-gray-900">{formatMoney(product.selling_price)}</span>
                    {product.compare_at_price && product.compare_at_price > (product.selling_price ?? 0) && (
                      <span className="text-sm text-gray-400 line-through">{formatMoney(product.compare_at_price)}</span>
                    )}
                  </div>
                  {product.estimated_delivery_min && product.estimated_delivery_max && (
                    <p className="mt-1 text-xs text-green-600">Est. {product.estimated_delivery_min}–{product.estimated_delivery_max}d</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
