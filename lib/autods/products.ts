// AutoDS product import
// TODO: Connect after AUTODS_API_KEY is set

import { autoDSFetch } from './client'

export interface AutoDSProduct {
  id: string
  title: string
  description: string
  price: number
  shipping_price: number
  images: string[]
  variants: AutoDSVariant[]
  supplier_url: string
  warehouse_country: string
  processing_time: number
  shipping_time: number
  tracking_available: boolean
}

export interface AutoDSVariant {
  sku: string
  price: number
  stock: number
}

export async function importAutodsProduct(supplierUrl: string): Promise<AutoDSProduct> {
  // TODO: Call AutoDS import endpoint with supplier product URL
  const result = await autoDSFetch<{ product: AutoDSProduct }>('/products/import', {
    method: 'POST',
    body: JSON.stringify({ url: supplierUrl }),
  })
  return result.product
}

export async function getAutodsProduct(autodsProductId: string): Promise<AutoDSProduct> {
  return autoDSFetch<AutoDSProduct>(`/products/${autodsProductId}`)
}

export async function checkAutodsInventory(autodsProductId: string): Promise<{ in_stock: boolean; quantity: number }> {
  return autoDSFetch(`/products/${autodsProductId}/inventory`)
}
