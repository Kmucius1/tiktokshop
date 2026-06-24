// TikTok Shop order sync and tracking upload
// TODO: Connect after TikTok Shop credentials are configured

import { tiktokFetch } from './client'

export interface TikTokOrder {
  order_id: string
  order_status: string
  payment_method: string
  buyer_uid: string
  item_list: TikTokOrderItem[]
  recipient_address: TikTokAddress
  create_time: number
}

export interface TikTokOrderItem {
  order_item_id: string
  product_id: string
  sku_id: string
  quantity: number
  sale_price: string
}

export interface TikTokAddress {
  name: string
  phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country_code: string
}

export async function fetchTikTokOrders(status = 'AWAITING_SHIPMENT'): Promise<TikTokOrder[]> {
  const result = await tiktokFetch<{ orders: TikTokOrder[] }>(
    `/order/202309/orders?order_status=${status}&page_size=50`
  )
  return result.orders ?? []
}

export async function uploadTikTokTracking(
  orderIds: string[],
  trackingNumber: string,
  providerName: string
): Promise<void> {
  // CRITICAL: TikTok Shop has strict SLA requirements for tracking upload
  // Upload tracking within 24 hours of order to protect account health
  const payload = {
    order_list: orderIds.map(order_id => ({
      order_id,
      tracking_number: trackingNumber,
      shipping_provider_name: providerName,
    })),
  }

  await tiktokFetch('/fulfillment/202309/packages/ship', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchTikTokOrderDetail(orderId: string): Promise<TikTokOrder> {
  const result = await tiktokFetch<{ order: TikTokOrder }>(
    `/order/202309/orders/${orderId}`
  )
  return result.order
}
