// AutoDS CSV import endpoint
// Accepts a multipart CSV upload from the admin sync page.
// Maps AutoDS export columns → products table. Upserts on autods_import_id to prevent duplicates.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Normalize a string to a URL-safe slug
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

// Make a slug unique by appending a random suffix if needed
function makeSlug(title: string, existingSlugs: Set<string>): string {
  const base = slugify(title)
  if (!existingSlugs.has(base)) return base
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

// Map a header row to a normalized key map
function buildHeaderMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  headers.forEach((h, i) => {
    map[h.toLowerCase().trim().replace(/\s+/g, '_')] = i
  })
  return map
}

function getField(row: string[], map: Record<string, number>, ...keys: string[]): string {
  for (const k of keys) {
    const idx = map[k]
    if (idx !== undefined && row[idx] !== undefined) {
      return row[idx].trim().replace(/^"|"$/g, '')
    }
  }
  return ''
}

function parsePrice(val: string): number | null {
  const n = parseFloat(val.replace(/[^0-9.]/g, ''))
  return isNaN(n) ? null : n
}

function parseImages(val: string): string[] {
  if (!val) return []
  return val
    .split(/[,|;]/)
    .map(s => s.trim())
    .filter(s => s.startsWith('http'))
    .slice(0, 10)
}

// Parse a simple CSV string (handles quoted fields with commas)
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const cells: string[] = []
    let inQuote = false
    let cell = ''
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cell += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        cells.push(cell)
        cell = ''
      } else {
        cell += ch
      }
    }
    cells.push(cell)
    rows.push(cells)
  }
  return rows
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const text = await file.text()
  const rows = parseCSV(text)

  if (rows.length < 2) {
    return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 })
  }

  const headers = rows[0]
  const map = buildHeaderMap(headers)
  const dataRows = rows.slice(1).filter(r => r.some(c => c.trim()))

  // Fetch existing slugs to avoid collisions
  const { data: existingProducts } = await supabase
    .from('products')
    .select('slug, autods_import_id')

  const slugSet = new Set((existingProducts ?? []).map(p => p.slug))
  const importedIds = new Set((existingProducts ?? []).map(p => p.autods_import_id).filter(Boolean))

  const imported: string[] = []
  const updated: string[] = []
  const skipped: string[] = []
  const errors: string[] = []

  for (const row of dataRows) {
    const title = getField(row, map,
      'product_title', 'title', 'name', 'product_name'
    )
    if (!title) { skipped.push('Row missing title — skipped'); continue }

    const autodsId = getField(row, map,
      'product_id', 'id', 'autods_id', 'autods_product_id', 'item_id', 'sku'
    ) || slugify(title)

    const rawImages = getField(row, map,
      'images', 'image_urls', 'image', 'photo', 'photos', 'image_url', 'main_image'
    )
    const images = parseImages(rawImages)
    const heroImage = images[0] ?? null

    const supplierUrl = getField(row, map,
      'source_url', 'supplier_url', 'product_url', 'url', 'link', 'aliexpress_url'
    )

    const category = getField(row, map,
      'category', 'product_category', 'type', 'product_type'
    ) || 'Uncategorized'

    const description = getField(row, map,
      'description', 'product_description', 'details', 'notes'
    )

    const tagsRaw = getField(row, map, 'tags', 'keywords', 'labels')
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []

    const costStr = getField(row, map, 'cost', 'product_cost', 'supplier_price', 'item_cost', 'price')
    const sellStr = getField(row, map, 'sell_price', 'selling_price', 'retail_price', 'sale_price')
    const shippingStr = getField(row, map, 'shipping_cost', 'shipping_price', 'ship_cost', 'shipping')
    const shippingDaysStr = getField(row, map, 'shipping_time', 'delivery_time', 'days', 'ship_days')
    const tiktokUrl = getField(row, map, 'tiktok_url', 'tiktok_shop_url', 'tiktok_link')

    const landedCost = parsePrice(costStr)
    const sellingPrice = parsePrice(sellStr)
    const shippingCost = parsePrice(shippingStr) ?? 0
    const deliveryDays = parseInt(shippingDaysStr, 10) || null

    const marginPct = sellingPrice && landedCost && sellingPrice > 0
      ? ((sellingPrice - landedCost - shippingCost) / sellingPrice) * 100
      : null

    const productData = {
      title,
      category,
      description: description || null,
      hero_image_url: heroImage,
      gallery_urls: images.length > 1 ? images : null,
      supplier_url: supplierUrl || null,
      tiktok_shop_url: tiktokUrl || null,
      landed_cost: landedCost,
      selling_price: sellingPrice,
      shipping_cost: shippingCost,
      margin_percent: marginPct ? parseFloat(marginPct.toFixed(2)) : null,
      delivery_days_max: deliveryDays,
      tags: tags.length ? tags : null,
      autods_import_id: autodsId,
      status: 'Researching',
      updated_at: new Date().toISOString(),
    }

    try {
      if (importedIds.has(autodsId)) {
        // Update existing product
        await supabase
          .from('products')
          .update(productData)
          .eq('autods_import_id', autodsId)
        updated.push(title)
      } else {
        // Insert new product
        const slug = makeSlug(title, slugSet)
        slugSet.add(slug)
        importedIds.add(autodsId)
        await supabase.from('products').insert({
          ...productData,
          slug,
          approval_status: 'Not Approved',
          published: false,
        })
        imported.push(title)
      }

      // Log to autods_sync_logs
      await supabase.from('autods_sync_logs').insert({
        product_id: null,
        action: 'import_product',
        status: 'success',
        request_payload: { source: 'csv', title, autods_import_id: autodsId },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${title}: ${msg}`)
    }
  }

  return NextResponse.json({
    imported: imported.length,
    updated: updated.length,
    skipped: skipped.length,
    errors: errors.length,
    error_details: errors.slice(0, 10),
    imported_titles: imported.slice(0, 5),
    updated_titles: updated.slice(0, 5),
  })
}
