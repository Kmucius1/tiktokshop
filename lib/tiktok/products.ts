// TikTok Shop product sync
// TODO: Connect after TikTok Shop credentials are configured

import { tiktokFetch } from './client'
import type { Product } from '@/types/supabase'

export interface TikTokProduct {
  product_id: string
  product_name: string
  product_status: string
  skus: TikTokSku[]
}

export interface TikTokSku {
  id: string
  seller_sku: string
  price: { amount: string; currency: string }
}

export async function syncProductToTikTok(product: Product): Promise<TikTokProduct> {
  // IMPORTANT: Only call this after product has passed TikTok approval checklist
  if (!product.approved_for_tiktok) {
    throw new Error('Product is not approved for TikTok Shop. Run approval flow first.')
  }

  // TODO: Map product fields to TikTok Shop product structure
  // TikTok Shop requires: title, description, category_id, images, skus, brand_id
  const payload = {
    product_name: product.title,
    description: product.description ?? product.short_description ?? '',
    skus: [
      {
        seller_sku: product.supplier_sku ?? product.slug,
        original_price: (product.selling_price ?? 0).toFixed(2),
      },
    ],
  }

  const result = await tiktokFetch<TikTokProduct>('/product/202309/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return result
}

export async function getTikTokProduct(tiktokProductId: string): Promise<TikTokProduct> {
  return tiktokFetch<TikTokProduct>(
    `/product/202309/products/${tiktokProductId}`
  )
}

export async function deactivateTikTokProduct(tiktokProductId: string): Promise<void> {
  // TODO: Use TikTok deactivate endpoint
  await tiktokFetch(`/product/202309/products/${tiktokProductId}/deactivate`, {
    method: 'POST',
  })
}
