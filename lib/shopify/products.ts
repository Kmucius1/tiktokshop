// Shopify product operations
// TODO: Connect after SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN are set

import { shopifyFetch } from './client'
import type { Product } from '@/types/supabase'

export interface ShopifyProduct {
  id: number
  title: string
  body_html: string
  vendor: string
  product_type: string
  handle: string
  status: 'active' | 'draft' | 'archived'
  variants: ShopifyVariant[]
  images: ShopifyImage[]
  tags: string
}

export interface ShopifyVariant {
  id: number
  price: string
  compare_at_price: string | null
  sku: string
  inventory_quantity: number
  fulfillment_service: string
}

export interface ShopifyImage {
  id: number
  src: string
  alt: string | null
}

export async function createShopifyProduct(product: Product): Promise<ShopifyProduct> {
  // TODO: Map ViralVault product fields to Shopify product structure
  const payload = {
    product: {
      title: product.title,
      body_html: product.description ?? '',
      vendor: 'ViralVault',
      product_type: product.category,
      handle: product.slug,
      status: 'draft',
      tags: (product.tags ?? []).join(', '),
      variants: [
        {
          price: (product.selling_price ?? 0).toFixed(2),
          compare_at_price: product.compare_at_price
            ? product.compare_at_price.toFixed(2)
            : undefined,
          sku: product.supplier_sku ?? '',
          inventory_management: 'shopify',
          fulfillment_service: 'manual',
        },
      ],
      images: product.hero_image_url
        ? [{ src: product.hero_image_url }]
        : [],
    },
  }

  const result = await shopifyFetch<{ product: ShopifyProduct }>('/products.json', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return result.product
}

export async function updateShopifyProduct(
  shopifyProductId: string,
  updates: Partial<ShopifyProduct>
): Promise<ShopifyProduct> {
  // TODO: Map updates and call Shopify API
  const result = await shopifyFetch<{ product: ShopifyProduct }>(
    `/products/${shopifyProductId}.json`,
    {
      method: 'PUT',
      body: JSON.stringify({ product: updates }),
    }
  )
  return result.product
}

export async function archiveShopifyProduct(shopifyProductId: string): Promise<void> {
  // TODO: Set product status to archived
  await shopifyFetch(`/products/${shopifyProductId}.json`, {
    method: 'PUT',
    body: JSON.stringify({ product: { status: 'archived' } }),
  })
}

export async function syncShopifyInventory(
  shopifyVariantId: string,
  quantity: number
): Promise<void> {
  // TODO: Use Shopify Inventory API to update stock levels
  // Requires location_id — fetch from /locations.json first
  console.log('[Shopify] syncShopifyInventory placeholder:', shopifyVariantId, quantity)
}
