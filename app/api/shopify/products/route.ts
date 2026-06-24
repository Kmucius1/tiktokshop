// Shopify product sync endpoint
// TODO: Activate after SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN are configured

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createShopifyProduct } from '@/lib/shopify/products'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { productId } = await request.json() as { productId: string }

  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 })
  }

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  if (!product.approved_for_shopify) {
    return NextResponse.json({ error: 'Product is not approved for Shopify' }, { status: 422 })
  }

  // Log the attempt
  const logEntry = {
    product_id: productId,
    action: 'create_product' as const,
    status: 'pending' as const,
    request_payload: { productId },
  }

  if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
    await supabase.from('shopify_sync_logs').insert({
      ...logEntry,
      status: 'skipped',
      error_message: 'Shopify credentials not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN.',
    })
    return NextResponse.json({
      skipped: true,
      message: 'Shopify credentials not configured. See .env.local.example.',
    })
  }

  try {
    const shopifyProduct = await createShopifyProduct(product)

    await supabase.from('products').update({
      shopify_product_id: String(shopifyProduct.id),
    }).eq('id', productId)

    await supabase.from('shopify_sync_logs').insert({
      ...logEntry,
      status: 'success',
      response_payload: shopifyProduct as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ shopifyProduct })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    await supabase.from('shopify_sync_logs').insert({
      ...logEntry,
      status: 'error',
      error_message: error,
    })
    return NextResponse.json({ error }, { status: 500 })
  }
}
