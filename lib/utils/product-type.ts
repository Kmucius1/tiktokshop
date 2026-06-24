import type { Product } from '@/types/supabase'

type AffiliateCheckFields = Pick<Product, 'product_type' | 'category'>

type ReadinessFields = Pick<
  Product,
  | 'title'
  | 'category'
  | 'hero_image_url'
  | 'amazon_affiliate_url'
  | 'amazon_product_url'
  | 'short_description'
  | 'why_trending'
>

export function isAffiliateProduct(product: AffiliateCheckFields): boolean {
  return product.product_type === 'amazon_affiliate' || product.category === 'Amazon Finds'
}

export interface AffiliateReadiness {
  titleOk: boolean
  categoryOk: boolean
  imageOk: boolean
  urlOk: boolean
  descriptionOk: boolean
  salesAngleOk: boolean
  canGoLive: boolean
}

export function getAffiliateReadiness(product: ReadinessFields): AffiliateReadiness {
  const titleOk = Boolean(product.title?.trim())
  const categoryOk = Boolean(product.category?.trim())
  const imageOk = Boolean(product.hero_image_url)
  const urlOk = Boolean(product.amazon_affiliate_url || product.amazon_product_url)
  const descriptionOk = Boolean(product.short_description?.trim())
  const salesAngleOk = Boolean(product.why_trending?.trim())
  return {
    titleOk,
    categoryOk,
    imageOk,
    urlOk,
    descriptionOk,
    salesAngleOk,
    canGoLive: titleOk && categoryOk && imageOk && urlOk && descriptionOk,
  }
}

export function getDemandLabel(
  monthlyPurchases: number | null
): { label: string; variant: 'hot' | 'good' | 'low' | 'unknown' } {
  if (monthlyPurchases === null) return { label: 'Not verified', variant: 'unknown' }
  if (monthlyPurchases >= 30000) return { label: `${(monthlyPurchases / 1000).toFixed(0)}k+ buys/mo`, variant: 'hot' }
  if (monthlyPurchases >= 20000) return { label: `${(monthlyPurchases / 1000).toFixed(0)}k+ buys/mo`, variant: 'good' }
  return { label: `${(monthlyPurchases / 1000).toFixed(1)}k buys/mo`, variant: 'low' }
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export { slugify }
