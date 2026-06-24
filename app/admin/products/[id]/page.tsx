export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductDetailTabs } from './ProductDetailTabs'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: product },
    { data: images },
    { data: variants },
    { data: listing },
    { data: content },
  ] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
    supabase.from('product_variants').select('*').eq('product_id', id).order('created_at'),
    supabase.from('tiktok_listings').select('*').eq('product_id', id).order('created_at').limit(1),
    supabase.from('product_content_queue').select('*').eq('product_id', id).order('created_at').limit(1),
  ])

  if (!product) notFound()

  return (
    <ProductDetailTabs
      product={product}
      images={images ?? []}
      variants={variants ?? []}
      listing={listing?.[0] ?? null}
      content={content?.[0] ?? null}
    />
  )
}
