// AutoDS product import endpoint
// TODO: Activate after AUTODS_API_KEY is configured

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { importAutodsProduct } from '@/lib/autods/products'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { productId, supplierUrl } = await request.json() as {
    productId: string
    supplierUrl: string
  }

  if (!productId || !supplierUrl) {
    return NextResponse.json({ error: 'productId and supplierUrl required' }, { status: 400 })
  }

  const logEntry = {
    product_id: productId,
    action: 'import_product' as const,
    status: 'pending' as const,
    request_payload: { productId, supplierUrl },
  }

  if (!process.env.AUTODS_API_KEY) {
    await supabase.from('autods_sync_logs').insert({
      ...logEntry,
      status: 'skipped',
      error_message: 'AUTODS_API_KEY not configured.',
    })
    return NextResponse.json({
      skipped: true,
      message: 'AutoDS API key not configured. Set AUTODS_API_KEY in .env.local.',
    })
  }

  try {
    const autodsProduct = await importAutodsProduct(supplierUrl)

    await supabase.from('products').update({
      autods_product_id: autodsProduct.id,
    }).eq('id', productId)

    await supabase.from('autods_sync_logs').insert({
      ...logEntry,
      status: 'success',
      response_payload: autodsProduct as unknown as Record<string, unknown>,
    })

    return NextResponse.json({ autodsProduct })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    await supabase.from('autods_sync_logs').insert({
      ...logEntry,
      status: 'error',
      error_message: error,
    })
    return NextResponse.json({ error }, { status: 500 })
  }
}
