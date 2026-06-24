import { createClient } from '@/lib/supabase/server'
import { formatMoney } from '@/lib/utils/money'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const SLUG_TO_CATEGORY: Record<string, string> = {
  'pool-day-finds': 'Outdoor & Seasonal',
  'backyard-water-fun': 'Outdoor & Seasonal',
  'beach-bag-essentials': 'Beach Bag Essentials',
  'summer-hosting': 'Home & Kitchen',
  'viral-drinkware': 'Viral Drinkware',
  'travel-vacation-finds': 'Travel + Vacation Finds',
  'under-25': 'Under $25',
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params
  const category = SLUG_TO_CATEGORY[slug]
  if (!category) notFound()

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('id, title, slug, category, selling_price, compare_at_price, hero_image_url, estimated_delivery_min, estimated_delivery_max')
    .eq('status', 'Live')
    .eq('approved_for_shopify', true)
    .order('score', { ascending: false })

  if (category === 'Under $25') {
    query = query.lt('selling_price', 25)
  } else {
    query = query.eq('category', category)
  }

  const { data: products } = await query

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">ViralVault Co.</Link>
          <Link href="/shop" className="text-sm text-sky-600 hover:underline">← Shop All</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">{category}</h1>

        {(products ?? []).length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center">
            <p className="text-4xl">🌊</p>
            <p className="mt-4 text-lg font-semibold text-gray-700">Coming soon</p>
            <p className="mt-2 text-sm text-gray-400">Products in this collection are being verified.</p>
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
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-sky-600">{product.category}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">{product.title}</p>
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
