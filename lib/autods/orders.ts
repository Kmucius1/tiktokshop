// AutoDS order fulfillment and tracking
// TODO: Connect after AUTODS_API_KEY is set

import { autoDSFetch } from './client'

export interface AutoDSOrderFulfillment {
  id: string
  order_id: string
  status: string
  tracking_number: string
  tracking_carrier: string
  estimated_delivery: string
}

export async function fulfillOrderWithAutoDS(
  shopifyOrderId: string,
  autodsProductId: string
): Promise<AutoDSOrderFulfillment> {
  // TODO: Map Shopify order to AutoDS fulfillment request
  const result = await autoDSFetch<{ fulfillment: AutoDSOrderFulfillment }>('/orders/fulfill', {
    method: 'POST',
    body: JSON.stringify({
      shopify_order_id: shopifyOrderId,
      autods_product_id: autodsProductId,
    }),
  })
  return result.fulfillment
}

export async function fetchAutodsTracking(autodsOrderId: string): Promise<{
  tracking_number: string
  carrier: string
  status: string
  last_update: string
}> {
  return autoDSFetch(`/orders/${autodsOrderId}/tracking`)
}
