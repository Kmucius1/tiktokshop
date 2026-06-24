export interface AmazonUrlAnalysis {
  originalUrl: string
  cleanProductUrl: string | null
  affiliateUrl: string
  asin: string | null
  trackingId: string | null
  isShortLink: boolean
  hasExistingTag: boolean
}

// ASIN patterns: /dp/ASIN, /gp/product/ASIN, /product/ASIN, /ASIN/ASIN
const ASIN_RE = /(?:\/dp\/|\/gp\/product\/|\/product\/|\/ASIN\/)([A-Z0-9]{10})(?:[/?]|$)/i
const TAG_RE = /[?&]tag=([^&]+)/
const SHORT_LINK_RE = /^https?:\/\/(a\.co|amzn\.to)\//

export function analyzeAmazonUrl(
  input: string,
  defaultTrackingId = 'zoeherstich-20'
): AmazonUrlAnalysis {
  const trimmed = input.trim()
  const isShortLink = SHORT_LINK_RE.test(trimmed)

  const asinMatch = trimmed.match(ASIN_RE)
  const asin = asinMatch ? asinMatch[1].toUpperCase() : null

  const tagMatch = trimmed.match(TAG_RE)
  const hasExistingTag = !!tagMatch
  const trackingId = tagMatch?.[1] ?? defaultTrackingId

  let cleanProductUrl: string | null = null
  let affiliateUrl = trimmed

  if (asin) {
    cleanProductUrl = `https://www.amazon.com/dp/${asin}`
    if (hasExistingTag) {
      affiliateUrl = trimmed // keep as-is with existing tag
    } else {
      affiliateUrl = `https://www.amazon.com/dp/${asin}?tag=${defaultTrackingId}`
    }
  } else if (isShortLink) {
    // Short links: keep original as affiliate URL, tag may be embedded
    affiliateUrl = trimmed
  }

  return {
    originalUrl: trimmed,
    cleanProductUrl,
    affiliateUrl,
    asin,
    trackingId,
    isShortLink,
    hasExistingTag,
  }
}

// Extract "10K+ bought in past month" → 10000
export function parseBoughtCount(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*K?\+?\s*bought/i)
  if (!match) return null
  const num = parseFloat(match[1])
  const hasK = /K/i.test(text.slice(text.indexOf(match[0]), text.indexOf(match[0]) + 20))
  return hasK ? Math.round(num * 1000) : Math.round(num)
}

// Extract price like "$29.99" or "29.99"
export function parsePrice(text: string): number | null {
  const match = text.match(/\$?\s*(\d{1,4}(?:\.\d{2})?)/i)
  return match ? parseFloat(match[1]) : null
}

// Extract rating like "4.5 out of 5" or "4.5 stars"
export function parseRating(text: string): number | null {
  const match = text.match(/(\d\.\d)\s*(?:out of 5|stars?)/i)
  return match ? parseFloat(match[1]) : null
}

// Extract review count like "12,345 ratings" or "(1,234)"
export function parseReviewCount(text: string): number | null {
  const match = text.match(/([\d,]+)\s*(?:ratings?|reviews?)/i)
  return match ? parseInt(match[1].replace(/,/g, ''), 10) : null
}
