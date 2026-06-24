// Saves parsed import rows into Supabase products table.
// Skips duplicates by source_product_id + source_platform or supplier_url.

import { createClient } from '@/lib/supabase/server'
import type { ColumnMap } from './detect-columns'

export interface ImportRow {
  [key: string]: string
}

export interface SaveResult {
  imported: number
  updated: number
  skipped: number
  errors: { row: number; message: string }[]
  importedTitles: string[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

function parsePrice(val: string): number | null {
  if (!val) return null
  const num = parseFloat(val.replace(/[^0-9.]/g, ''))
  return isNaN(num) ? null : num
}

function parseIntVal(val: string): number | null {
  if (!val) return null
  const num = global.parseInt(val.replace(/[^0-9]/g, ''), 10)
  return isNaN(num) ? null : num
}

export async function saveImportedProducts(
  rows: ImportRow[],
  columnMap: ColumnMap,
  batchId: string,
  sourcePlatform: string = 'autods_csv'
): Promise<SaveResult> {
  const supabase = await createClient()
  const result: SaveResult = { imported: 0, updated: 0, skipped: 0, errors: [], importedTitles: [] }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // 1-indexed, row 1 is headers

    const title = columnMap.title ? row[columnMap.title]?.trim() : undefined
    if (!title) {
      result.errors.push({ row: rowNum, message: 'Missing title — row skipped' })
      result.skipped++
      continue
    }

    const sourceProductId = columnMap.source_product_id ? row[columnMap.source_product_id]?.trim() : undefined
    const supplierUrl     = columnMap.supplier_url       ? row[columnMap.supplier_url]?.trim()       : undefined
    const costPrice       = columnMap.cost_price         ? parsePrice(row[columnMap.cost_price])      : null
    const shippingCost    = columnMap.shipping_cost      ? parsePrice(row[columnMap.shipping_cost])   : null
    const sellingPrice    = columnMap.selling_price      ? parsePrice(row[columnMap.selling_price])   : null
    const inventory       = columnMap.inventory          ? parseIntVal(row[columnMap.inventory])         : null
    const processingTime  = columnMap.processing_time    ? parseIntVal(row[columnMap.processing_time])   : null

    // Calculate margin if we have price data
    let marginPercent: number | null = null
    if (sellingPrice && costPrice && sellingPrice > 0) {
      const profit = sellingPrice - costPrice - (shippingCost ?? 0)
      marginPercent = (profit / sellingPrice) * 100
    }

    // Check for duplicate
    if (sourceProductId) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('source_platform', sourcePlatform)
        .eq('source_product_id', sourceProductId)
        .single()

      if (existing) {
        // Update pricing/inventory
        await supabase.from('products').update({
          landed_cost:       costPrice,
          shipping_cost:     shippingCost,
          selling_price:     sellingPrice,
          margin_percent:    marginPercent,
          inventory:         inventory,
          updated_at:        new Date().toISOString(),
        }).eq('id', existing.id)
        result.updated++
        continue
      }
    }

    // Build unique slug
    let baseSlug = slugify(title)
    const { data: slugCheck } = await supabase
      .from('products')
      .select('id')
      .eq('slug', baseSlug)
      .single()
    if (slugCheck) {
      baseSlug = `${baseSlug}-${Date.now().toString(36)}`
    }

    const imageUrl = columnMap.image_url ? row[columnMap.image_url]?.trim() : undefined

    const productData = {
      title,
      slug:              baseSlug,
      description:       columnMap.description    ? row[columnMap.description]?.trim()    : null,
      supplier_url:      supplierUrl              ?? null,
      category:          columnMap.category       ? row[columnMap.category]?.trim()       : null,
      landed_cost:       costPrice,
      shipping_cost:     shippingCost,
      selling_price:     sellingPrice,
      margin_percent:    marginPercent,
      supplier_sku:      columnMap.sku            ? row[columnMap.sku]?.trim()            : null,
      inventory:         inventory,
      processing_time:   processingTime,
      source_platform:   sourcePlatform,
      source_product_id: sourceProductId          ?? null,
      hero_image_url:    imageUrl                 ?? null,
      status:            'Researching' as const,
      listing_status:    'Not Prepared' as const,
      content_queue_status: 'Not Started' as const,
      export_batch_id:   batchId,
      imported_at:       new Date().toISOString(),
      autods_import_id:  sourceProductId          ?? null,
    }

    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert(productData)
      .select('id')
      .single()

    if (insertError) {
      result.errors.push({ row: rowNum, message: insertError.message })
      result.skipped++
      continue
    }

    // Save primary image to product_images
    if (imageUrl && newProduct?.id) {
      await supabase.from('product_images').insert({
        product_id: newProduct.id,
        image_url:  imageUrl,
        sort_order: 0,
        is_primary: true,
      })
    }

    result.imported++
    result.importedTitles.push(title)
  }

  return result
}
