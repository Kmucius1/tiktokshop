// Generates TikTok Seller Center-compatible XLSX export files.
// Two formats: full export and Product Upload Accelerator (minimal required fields).

export interface ExportProduct {
  id: string
  title: string
  description?: string | null
  selling_price?: number | null
  inventory?: number | null
  supplier_sku?: string | null
  category?: string | null
  tiktok_category?: string | null
  hero_image_url?: string | null
  tiktok_listings?: {
    tiktok_title?: string | null
    tiktok_description?: string | null
    tiktok_category?: string | null
    brand?: string | null
    price?: number | null
    inventory?: number | null
  }[]
}

export async function buildTikTokExport(products: ExportProduct[]): Promise<Buffer> {
  const XLSX = await import('xlsx')

  const rows = products.map(p => {
    const listing = p.tiktok_listings?.[0]
    return {
      'Product Name':         listing?.tiktok_title  || p.title || '',
      'Product Description':  listing?.tiktok_description || p.description || '',
      'Price':                (listing?.price ?? p.selling_price ?? '').toString(),
      'Quantity':             (listing?.inventory ?? p.inventory ?? '').toString(),
      'SKU':                  p.supplier_sku || '',
      'Category':             listing?.tiktok_category || p.tiktok_category || p.category || '',
      'Brand':                listing?.brand || '',
      'Main Image URL':       p.hero_image_url || '',
      'Identifier Code':      p.supplier_sku || p.id,
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')

  // Column widths
  ws['!cols'] = [
    { wch: 60 }, // Product Name
    { wch: 100 }, // Description
    { wch: 12 }, // Price
    { wch: 12 }, // Quantity
    { wch: 20 }, // SKU
    { wch: 30 }, // Category
    { wch: 20 }, // Brand
    { wch: 60 }, // Image URL
    { wch: 20 }, // Identifier Code
  ]

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

export async function buildAcceleratorExport(products: ExportProduct[]): Promise<Buffer> {
  const XLSX = await import('xlsx')

  // Minimal required fields for TikTok's Product Upload Accelerator
  const rows = products.map(p => {
    const listing = p.tiktok_listings?.[0]
    return {
      'Identifier Code':      p.supplier_sku || p.id,
      'Product Name':         listing?.tiktok_title || p.title || '',
      'Product Description':  listing?.tiktok_description || p.description || '',
      'Price':                (listing?.price ?? p.selling_price ?? '').toString(),
      'Quantity':             (listing?.inventory ?? p.inventory ?? '').toString(),
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')

  ws['!cols'] = [
    { wch: 20 },
    { wch: 60 },
    { wch: 100 },
    { wch: 12 },
    { wch: 12 },
  ]

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
