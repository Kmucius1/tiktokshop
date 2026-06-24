// Maps raw CSV/XLSX headers to our internal field names.
// AutoDS exports use different column names depending on export type.

export interface ColumnMap {
  title?: string
  description?: string
  supplier_url?: string
  supplier_name?: string
  source_product_id?: string
  cost_price?: string
  shipping_cost?: string
  selling_price?: string
  sku?: string
  inventory?: string
  category?: string
  image_url?: string
  processing_time?: string
  variants?: string
  weight?: string
}

const SYNONYMS: Record<keyof ColumnMap, string[]> = {
  title:             ['title', 'product title', 'product name', 'name', 'item title', 'item name'],
  description:       ['description', 'product description', 'desc', 'details', 'body html', 'body'],
  supplier_url:      ['supplier url', 'source url', 'product url', 'supplier link', 'item url', 'url', 'link'],
  supplier_name:     ['supplier name', 'supplier', 'vendor', 'source', 'store name'],
  source_product_id: ['product id', 'source product id', 'item id', 'autods id', 'external id', 'id'],
  cost_price:        ['cost', 'cost price', 'item cost', 'purchase price', 'buy price', 'supplier price', 'price (cost)'],
  shipping_cost:     ['shipping', 'shipping cost', 'shipping fee', 'freight', 'shipping price'],
  selling_price:     ['selling price', 'price', 'retail price', 'sale price', 'listed price', 'compare at price'],
  sku:               ['sku', 'item sku', 'product sku', 'barcode', 'upc', 'asin'],
  inventory:         ['inventory', 'quantity', 'stock', 'qty', 'available', 'stock quantity', 'units available'],
  category:          ['category', 'product category', 'type', 'product type', 'collection'],
  image_url:         ['image', 'image url', 'main image', 'photo', 'image link', 'images', 'image urls', 'thumbnail'],
  processing_time:   ['processing time', 'handling time', 'dispatch time', 'lead time', 'days to ship'],
  variants:          ['variants', 'options', 'variant', 'size', 'color'],
  weight:            ['weight', 'item weight', 'package weight', 'weight (kg)', 'weight (lbs)'],
}

export function detectColumns(headers: string[]): ColumnMap {
  const normalized = headers.map(h => h.toLowerCase().trim())
  const result: ColumnMap = {}

  for (const [field, synonyms] of Object.entries(SYNONYMS)) {
    for (const synonym of synonyms) {
      const idx = normalized.findIndex(h => h === synonym || h.includes(synonym))
      if (idx !== -1) {
        result[field as keyof ColumnMap] = headers[idx]
        break
      }
    }
  }

  return result
}

export function getUnmappedHeaders(headers: string[], map: ColumnMap): string[] {
  const mapped = new Set(Object.values(map).filter(Boolean))
  return headers.filter(h => !mapped.has(h))
}

export function getMissingRequired(map: ColumnMap): string[] {
  const required: (keyof ColumnMap)[] = ['title']
  return required.filter(f => !map[f])
}
