import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saveImportedProducts } from '@/lib/import/save-products'
import type { ColumnMap } from '@/lib/import/detect-columns'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    rows: Record<string, string>[]
    columnMap: ColumnMap
    fileName?: string
    sourcePlatform?: string
  }

  const { rows, columnMap, fileName, sourcePlatform = 'autods_csv' } = body

  if (!rows?.length) return NextResponse.json({ error: 'No rows provided' }, { status: 400 })

  // Create import batch record
  const { data: batch } = await supabase
    .from('product_import_batches')
    .insert({
      source:      sourcePlatform,
      file_name:   fileName ?? null,
      total_rows:  rows.length,
      status:      'pending',
    })
    .select('id')
    .single()

  const batchId = batch?.id ?? crypto.randomUUID()

  const result = await saveImportedProducts(rows, columnMap, batchId, sourcePlatform)

  // Update batch with results
  await supabase
    .from('product_import_batches')
    .update({
      imported_count: result.imported,
      updated_count:  result.updated,
      skipped_count:  result.skipped,
      error_count:    result.errors.length,
      error_details:  result.errors.length ? result.errors : null,
      status:         'complete',
    })
    .eq('id', batchId)

  return NextResponse.json({
    batchId,
    imported:        result.imported,
    updated:         result.updated,
    skipped:         result.skipped,
    errors:          result.errors,
    importedTitles:  result.importedTitles.slice(0, 10),
  })
}
