import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildTikTokExport, buildAcceleratorExport } from '@/lib/export/tiktok-xlsx'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productIds, format = 'full' } = await request.json() as {
    productIds: string[]
    format?: 'full' | 'accelerator'
  }

  if (!productIds?.length) return NextResponse.json({ error: 'No products selected' }, { status: 400 })

  const { data: products } = await supabase
    .from('products')
    .select(`
      id, title, description, selling_price, inventory, supplier_sku,
      category, tiktok_category, hero_image_url,
      tiktok_listings(tiktok_title, tiktok_description, tiktok_category, brand, price, inventory)
    `)
    .in('id', productIds)

  if (!products?.length) return NextResponse.json({ error: 'No products found' }, { status: 404 })

  const batchId = crypto.randomUUID()

  const buffer = format === 'accelerator'
    ? await buildAcceleratorExport(products)
    : await buildTikTokExport(products)

  // Mark products as exported
  await supabase
    .from('products')
    .update({ listing_status: 'Exported', export_batch_id: batchId })
    .in('id', productIds)

  await supabase
    .from('tiktok_listings')
    .update({ listing_status: 'Exported', export_batch_id: batchId })
    .in('product_id', productIds)

  // Log the export
  await supabase.from('product_import_batches').insert({
    source:         'autods_csv',
    file_name:      `tiktok-export-${batchId.slice(0, 8)}.xlsx`,
    total_rows:     productIds.length,
    imported_count: productIds.length,
    status:         'complete',
  })

  const fileName = format === 'accelerator'
    ? `tiktok-accelerator-${new Date().toISOString().slice(0, 10)}.xlsx`
    : `tiktok-products-${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
