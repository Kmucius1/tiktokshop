import { NextRequest, NextResponse } from 'next/server'

export interface AmazonScrapeResult {
  asin: string | null
  title: string
  images: string[]       // all full-size images found
  mainImage: string      // highest-res main image
  price: string          // e.g. "34.99"
  priceRange: string     // e.g. "$14.99 - $34.99" for variants
  rating: string         // e.g. "4.6"
  reviewCount: string    // e.g. "12453"
  bullets: string        // newline-separated "About this item" bullets
  brand: string
  variants: VariantInfo[]
  finalUrl: string
  blocked: boolean
  error?: string
}

export interface VariantInfo {
  label: string   // e.g. "Small - Black"
  asin: string
  price: string
  image: string
}

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-CH-UA': '"Chromium";v="124", "Google Chrome";v="124"',
  'Sec-CH-UA-Mobile': '?0',
  'Sec-CH-UA-Platform': '"macOS"',
  'Cache-Control': 'max-age=0',
}

// ─── Parsers ──────────────────────────────────────────────────

function parseAsin(url: string): string | null {
  const m = url.match(/(?:\/dp\/|\/gp\/product\/|\/product\/|\/ASIN\/)([A-Z0-9]{10})(?:[/?]|$)/i)
  return m ? m[1].toUpperCase() : null
}

function parseTitle(html: string): string {
  const patterns = [
    /<span\s+id="productTitle"[^>]*>([\s\S]*?)<\/span>/i,
    /<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i,
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m) return m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  }
  return ''
}

function parseBrand(html: string): string {
  const m = html.match(/id="bylineInfo"[^>]*>\s*(?:Brand:|Visit the)?\s*<[^>]*>([^<]+)</i)
    ?? html.match(/"brand":"([^"]+)"/i)
  return m?.[1]?.trim() ?? ''
}

function parsePrice(html: string): { price: string; priceRange: string } {
  // Try structured data first (most reliable)
  const ldMatch = html.match(/"price"\s*:\s*"([\d.,]+)"/i)
  const rangeMatch = html.match(/["']priceRange["']\s*:\s*["']([^"']+)["']/i)
    ?? html.match(/\$([\d.]+)\s*[-–]\s*\$([\d.]+)/i)

  let price = ldMatch?.[1]?.replace(',', '') ?? ''
  let priceRange = ''

  if (rangeMatch) {
    priceRange = rangeMatch[0].trim()
  }

  if (!price) {
    // Try visible price spans
    const spans = [...html.matchAll(/class="a-offscreen">[\s]*\$?([\d.,]+)/gi)]
    if (spans.length) price = spans[0][1].replace(',', '')
  }

  if (!price) {
    // Try priceblock
    const pb = html.match(/id="priceblock_ourprice"[^>]*>\s*\$?([\d.,]+)/i)
    if (pb) price = pb[1].replace(',', '')
  }

  return { price, priceRange }
}

function parseRating(html: string): { rating: string; reviewCount: string } {
  const ratingM = html.match(/([\d.]+) out of 5 stars/i)
    ?? html.match(/"ratingValue"\s*:\s*"([\d.]+)"/i)
  const reviewM = html.match(/([\d,]+)\s+(?:global\s+)?ratings/i)
    ?? html.match(/"reviewCount"\s*:\s*"([\d,]+)"/i)
    ?? html.match(/id="acrCustomerReviewText"[^>]*>([\d,]+)\s/i)

  return {
    rating: ratingM?.[1] ?? '',
    reviewCount: reviewM?.[1]?.replace(/,/g, '') ?? '',
  }
}

function parsePurchaseVolume(html: string): string {
  // "10K+ bought in past month"
  const m = html.match(/([\d,.]+[kK]?\+?)\s+(?:people\s+)?bought\s+(?:this\s+)?(?:in\s+the\s+)?past\s+month/i)
  if (!m) return ''
  const raw = m[1].toLowerCase()
  if (raw.includes('k')) return String(Math.round(parseFloat(raw) * 1000))
  return raw.replace(/[^0-9]/g, '')
}

function parseBullets(html: string): string {
  // Feature bullets section
  const sectionM = html.match(/id="feature-bullets"([\s\S]*?)(?:id="variation_|id="detailBullets|id="productDetails)/i)
  if (!sectionM) return ''

  const items = [...sectionM[1].matchAll(/<span class="a-list-item">([\s\S]*?)<\/span>/gi)]
  return items
    .map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
    .filter(t => t.length > 5)
    .map(t => `• ${t}`)
    .join('\n')
}

function parseImages(html: string): string[] {
  const found = new Set<string>()

  // Strategy 1: colorImages JavaScript variable (most complete)
  const colorImagesM = html.match(/'colorImages'\s*:\s*\{\s*'initial'\s*:\s*(\[[\s\S]*?\])\s*\}/)
  if (colorImagesM) {
    try {
      const arr = JSON.parse(colorImagesM[1]) as Array<Record<string, string>>
      for (const img of arr) {
        const url = img.hiRes || img.large || img['main']
        if (url && url.startsWith('http')) found.add(url)
      }
    } catch { /* ignore parse errors */ }
  }

  // Strategy 2: data-old-hires (main image hi-res)
  const oldHires = [...html.matchAll(/data-old-hires="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/gi)]
  for (const m of oldHires) found.add(m[1])

  // Strategy 3: hiRes entries in any JSON block
  const hiResUrls = [...html.matchAll(/"hiRes"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/gi)]
  for (const m of hiResUrls) found.add(m[1])

  // Strategy 4: data-a-dynamic-image (all image URLs with dimensions)
  const dynamicM = [...html.matchAll(/data-a-dynamic-image="([^"]+)"/gi)]
  for (const dm of dynamicM) {
    try {
      const decoded = dm[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
      const urls = [...decoded.matchAll(/"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/gi)]
      for (const u of urls) found.add(u[1])
    } catch { /* ignore */ }
  }

  // Filter: prefer large images, remove thumbnail-sized ones
  const filtered = [...found].filter(url =>
    !url.includes('._SS') &&   // small square thumbnails
    !url.includes('._US')      // micro thumbnails
  )

  // Prefer _SL1500_ or _AC_SL1500_ (highest resolution)
  const sortedUrls = filtered.sort((a, b) => {
    const aIsLarge = /_(SL|AC_SL)15/.test(a) ? -1 : 0
    const bIsLarge = /_(SL|AC_SL)15/.test(b) ? -1 : 0
    return aIsLarge - bIsLarge
  })

  return [...new Set(sortedUrls)].slice(0, 12) // max 12 images
}

function parseVariants(html: string): VariantInfo[] {
  const variants: VariantInfo[] = []

  // Look for dimensionToAsinMap or twisterData
  const twisterM = html.match(/"dimensionToAsinMap"\s*:\s*(\{[^}]+\})/i)
    ?? html.match(/"twister_hero_asin_and_new_price"\s*:\s*(\{[^}]+\})/i)

  if (twisterM) {
    try {
      const map = JSON.parse(twisterM[1]) as Record<string, string>
      for (const [label, asin] of Object.entries(map)) {
        if (/^[A-Z0-9]{10}$/.test(asin)) {
          variants.push({ label: label.replace(/_/g, ' '), asin, price: '', image: '' })
        }
      }
    } catch { /* ignore */ }
  }

  return variants.slice(0, 10)
}

// ─── Main scraper ─────────────────────────────────────────────
async function scrapeAmazon(url: string): Promise<AmazonScrapeResult> {
  let html: string
  let finalUrl = url

  try {
    const resp = await fetch(url, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
      // 15 second timeout
      signal: AbortSignal.timeout(15000),
    })

    finalUrl = resp.url

    if (resp.status === 503 || resp.status === 403) {
      return {
        asin: parseAsin(finalUrl) ?? parseAsin(url), title: '', images: [], mainImage: '',
        price: '', priceRange: '', rating: '', reviewCount: '',
        bullets: '', brand: '', variants: [], finalUrl,
        blocked: true, error: `Amazon returned ${resp.status} — bot detection triggered`,
      }
    }

    const ct = resp.headers.get('content-type') ?? ''
    if (!ct.includes('html')) {
      return {
        asin: parseAsin(finalUrl) ?? parseAsin(url), title: '', images: [], mainImage: '',
        price: '', priceRange: '', rating: '', reviewCount: '',
        bullets: '', brand: '', variants: [], finalUrl,
        blocked: true, error: 'Unexpected content type',
      }
    }

    html = await resp.text()
  } catch (err: unknown) {
    return {
      asin: parseAsin(url), title: '', images: [], mainImage: '',
      price: '', priceRange: '', rating: '', reviewCount: '',
      bullets: '', brand: '', variants: [], finalUrl,
      blocked: true, error: err instanceof Error ? err.message : 'Fetch failed',
    }
  }

  // Check for CAPTCHA / robot check page
  if (
    html.includes('Type the characters you see in this image') ||
    html.includes('Enter the characters you see below') ||
    html.includes('robot') && html.includes('captcha') ||
    html.length < 5000
  ) {
    return {
      asin: parseAsin(finalUrl), title: '', images: [], mainImage: '',
      price: '', priceRange: '', rating: '', reviewCount: '',
      bullets: '', brand: '', variants: [], finalUrl,
      blocked: true, error: 'Amazon triggered a CAPTCHA check',
    }
  }

  const asin = parseAsin(finalUrl) ?? parseAsin(url)
  const title = parseTitle(html)
  const brand = parseBrand(html)
  const { price, priceRange } = parsePrice(html)
  const { rating, reviewCount } = parseRating(html)
  const bullets = parseBullets(html)
  const images = parseImages(html)
  const variants = parseVariants(html)
  const purchaseVolume = parsePurchaseVolume(html)

  return {
    asin,
    title,
    brand,
    images,
    mainImage: images[0] ?? '',
    price,
    priceRange,
    rating,
    reviewCount,
    bullets: purchaseVolume
      ? bullets + `\n• ${purchaseVolume}+ bought in past month`
      : bullets,
    variants,
    finalUrl,
    blocked: false,
  }
}

// ─── Route handler ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: { url: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!body.url?.trim()) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  const result = await scrapeAmazon(body.url.trim())
  return NextResponse.json(result)
}
