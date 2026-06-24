// Viral product scoring — separate from the compliance/logistics score.
// Max 100 points. Weights can be tuned by adjusting the constants below.

export interface ViralScoreInput {
  views_count?: number | null
  purchase_count?: number | null
  margin_percent?: number | null
  landing_cost?: number | null
  selling_price?: number | null
  shipping_cost?: number | null
  handling_days_max?: number | null
  delivery_days_max?: number | null
  content_potential_score?: number | null  // 0–15, set manually in admin
  amazon_rating?: number | null
  monthly_purchases?: number | null        // from Amazon affiliate side
}

export interface ViralScoreBreakdown {
  total: number
  views_score: number         // 0–25: how many views/traction signals
  purchase_score: number      // 0–25: purchase volume signals
  margin_score: number        // 0–20: profit margin quality
  shipping_score: number      // 0–15: delivery speed (fast = more TikTok viable)
  content_potential: number   // 0–15: manually set by admin
  notes: string[]
}

function scoreViews(input: ViralScoreInput): { score: number; note: string } {
  const views = input.views_count ?? 0
  const purchases = input.monthly_purchases ?? 0

  if (views >= 1_000_000 || purchases >= 50_000) return { score: 25, note: 'Massive demand signal — 1M+ views or 50K+ monthly buys' }
  if (views >= 500_000 || purchases >= 20_000) return { score: 20, note: 'Strong demand — 500K+ views or 20K+ buys/month' }
  if (views >= 100_000 || purchases >= 5_000)  return { score: 15, note: 'Good traction — 100K+ views or 5K+ buys/month' }
  if (views >= 10_000  || purchases >= 1_000)  return { score: 8,  note: 'Moderate demand signal' }
  if (views > 0 || purchases > 0)              return { score: 3,  note: 'Low signal — needs more data' }
  return { score: 0, note: 'No view or purchase data entered' }
}

function scorePurchases(input: ViralScoreInput): { score: number; note: string } {
  const purchases = input.purchase_count ?? input.monthly_purchases ?? 0
  const rating = input.amazon_rating ?? 0

  let base = 0
  if (purchases >= 10_000) base = 25
  else if (purchases >= 3_000) base = 20
  else if (purchases >= 500)  base = 12
  else if (purchases >= 100)  base = 6
  else if (purchases > 0)     base = 2

  // Bonus for high rating
  if (rating >= 4.5 && purchases > 0) base = Math.min(25, base + 3)
  const note = purchases > 0
    ? `${purchases.toLocaleString()} purchases${rating >= 4.5 ? ` · ${rating}★ rating` : ''}`
    : 'No purchase data entered'

  return { score: base, note }
}

function scoreMargin(input: ViralScoreInput): { score: number; note: string } {
  const { selling_price, landing_cost, shipping_cost, margin_percent } = input

  let pct = margin_percent ?? null

  if (pct === null && selling_price && landing_cost) {
    const profit = selling_price - landing_cost - (shipping_cost ?? 0)
    pct = selling_price > 0 ? (profit / selling_price) * 100 : 0
  }

  if (pct === null) return { score: 0, note: 'Margin not calculable — enter price and cost' }
  if (pct >= 60) return { score: 20, note: `${pct.toFixed(1)}% margin — excellent` }
  if (pct >= 45) return { score: 14, note: `${pct.toFixed(1)}% margin — strong` }
  if (pct >= 30) return { score: 8,  note: `${pct.toFixed(1)}% margin — acceptable` }
  if (pct >= 15) return { score: 3,  note: `${pct.toFixed(1)}% margin — tight` }
  return { score: 0, note: `${pct.toFixed(1)}% margin — too low for TikTok ads` }
}

function scoreShipping(input: ViralScoreInput): { score: number; note: string } {
  const total = (input.handling_days_max ?? null) !== null && (input.delivery_days_max ?? null) !== null
    ? (input.handling_days_max ?? 0) + (input.delivery_days_max ?? 0)
    : null

  if (total === null) return { score: 5, note: 'Shipping time unknown — partial credit' }
  if (total <= 5)  return { score: 15, note: `${total}d total — very fast` }
  if (total <= 7)  return { score: 12, note: `${total}d total — fast` }
  if (total <= 10) return { score: 7,  note: `${total}d total — acceptable` }
  if (total <= 14) return { score: 3,  note: `${total}d total — slow for TikTok` }
  return { score: 0, note: `${total}d total — too slow` }
}

function scoreContentPotential(input: ViralScoreInput): { score: number; note: string } {
  const score = Math.min(15, Math.max(0, input.content_potential_score ?? 0))
  if (score >= 13) return { score, note: 'Strong visual demo potential — admin confirmed' }
  if (score >= 8)  return { score, note: 'Good content potential — admin confirmed' }
  if (score > 0)   return { score, note: 'Some content potential — admin assessed' }
  return { score: 0, note: 'Content potential not assessed yet — set in admin' }
}

export function calcViralScore(input: ViralScoreInput): ViralScoreBreakdown {
  const views    = scoreViews(input)
  const purchase = scorePurchases(input)
  const margin   = scoreMargin(input)
  const shipping = scoreShipping(input)
  const content  = scoreContentPotential(input)

  const total = views.score + purchase.score + margin.score + shipping.score + content.score

  return {
    total,
    views_score:       views.score,
    purchase_score:    purchase.score,
    margin_score:      margin.score,
    shipping_score:    shipping.score,
    content_potential: content.score,
    notes: [views.note, purchase.note, margin.note, shipping.note, content.note],
  }
}
