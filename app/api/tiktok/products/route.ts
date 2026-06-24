// TikTok Shop product sync endpoint
// TODO: Activate after TikTok Shop credentials are configured

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncProductToTikTok } from '@/lib/tiktok/products'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only owner/admin can push to TikTok
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only owner or admin can sync to TikTok Shop' }, { status: 403 })
  }

  const { productId } = await request.json() as { productId: string }

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  if (!product.approved_for_tiktok) {
    return NextResponse.json({
      error: 'Product is not approved for TikTok Shop. Complete the TikTok readiness checklist first.',
    }, { status: 422 })
  }

  const logEntry = {
    product_id: productId,
    action: 'create_product' as const,
    status: 'pending' as const,
    request_payload: { productId },
  }

  if (!process.env.TIKTOK_SHOP_APP_KEY || !process.env.TIKTOK_SHOP_ACCESS_TOKEN) {
    await supabase.from('tiktok_sync_logs').insert({
      ...logEntry,
      status: 'skipped',
      error_message: 'TikTok Shop credentials not configured.',
    })
    return NextResponse.json({
      skipped: true,
      message: 'TikTok Shop credentials not configured. Set TIKTOK_SHOP_APP_KEY and TIKTOK_SHOP_ACCESS_TOKEN.',
    })
  }

  try {
    const tiktokProduct = await syncProductToTikTok(product)

    await supabase.from('products').update({
      tiktok_product_id: tiktokProduct.product_id,
    }).eq('id', productId)

    await supabase.from('tiktok_sync_logs').insert({
      ...logEntry,
      status: 'success',
      response_payload: tiktokProduct as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ tiktokProduct })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    await supabase.from('tiktok_sync_logs').insert({
      ...logEntry,
      status: 'error',
      error_message: error,
    })
    return NextResponse.json({ error }, { status: 500 })
  }
}
