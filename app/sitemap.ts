import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiktokshop.art'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at, category')
    .eq('status', 'Live')
    .or('product_type.eq.amazon_affiliate,category.eq.Amazon Finds')

  const liveProducts = (products ?? []).filter(
    p => p.slug && p.category
  )

  const uniqueCategories = [
    ...new Set(liveProducts.map(p => slugify(p.category)).filter(Boolean)),
  ]

  const productUrls: MetadataRoute.Sitemap = liveProducts.map(p => ({
    url: `${siteUrl}/product/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const collectionUrls: MetadataRoute.Sitemap = uniqueCategories.map(slug => ({
    url: `${siteUrl}/collections/${slug}`,
    changeFrequency: 'daily',
    priority: 0.6,
  }))

  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/amazon-finds`, changeFrequency: 'daily', priority: 0.9 },
    ...collectionUrls,
    ...productUrls,
  ]
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
