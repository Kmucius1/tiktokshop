// Shopify order operations
// TODO: Connect after credentials are set

import { shopifyFetch } from './client'

export interface ShopifyOrder {
  id: number
  name: string
  email: string
  financial_status: string
  fulfillment_status: string | null
  total_price: string
  line_items: ShopifyLineItem[]
  shipping_address: ShopifyAddress
  created_at: string
}

export interface ShopifyLineItem {
  id: number
  variant_id: number
  title: string
  quantity: number
  price: string
  sku: string
}

export interface ShopifyAddress {
  first_name: string
  last_name: string
  address1: string
  city: string
  province: string
  zip: string
  country: string
}

export interface ShopifyFulfillment {
  id: number
  order_id: number
  status: string
  tracking_number: string
  tracking_company: string
  tracking_url: string
}

export async function fetchShopifyOrder(orderId: string): Promise<ShopifyOrder> {
  const result = await shopifyFetch<{ order: ShopifyOrder }>(`/orders/${orderId}.json`)
  return result.order
}

export async function fetchOpenShopifyOrders(limit = 50): Promise<ShopifyOrder[]> {
  const result = await shopifyFetch<{ orders: ShopifyOrder[] }>(
    `/orders.json?status=open&limit=${limit}`
  )
  return result.orders
}

export async function createShopifyFulfillment(
  orderId: string,
  trackingNumber: string,
  trackingCompany: string,
  lineItemIds: number[]
): Promise<ShopifyFulfillment> {
  // TODO: Use Shopify Fulfillment API v2024
  const payload = {
    fulfillment: {
      line_items_by_fulfillment_order: [],
      tracking_info: {
        number: trackingNumber,
        company: trackingCompany,
      },
      notify_customer: true,
    },
  }

  const result = await shopifyFetch<{ fulfillment: ShopifyFulfillment }>(
    `/orders/${orderId}/fulfillments.json`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
  return result.fulfillment
}
