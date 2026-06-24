import { NextRequest, NextResponse } from 'next/server'

// ─── Pure server-side copy generator ─────────────────────────
// No external API required. Uses copy formulas, bullet parsing,
// and category-specific patterns proven for affiliate commerce.

interface GenerateRequest {
  title?: string
  category?: string
  bullets?: string
  price?: string
  rating?: string
  reviews?: string
  monthly_purchases?: string
  notes?: string
  type: 'all' | 'seo' | 'viral' | 'pinterest' | 'summary' | 'short_description'
}

// ─── Bullet parsing ───────────────────────────────────────────
function extractFeatures(bullets: string): string[] {
  if (!bullets.trim()) return []
  return bullets
    .split('\n')
    .map(l => l.replace(/^[•·\-\*\d+\.]\s*/, '').trim())
    .filter(l =>
      l.length > 8 &&
      !/^\$[\d.,]+/.test(l) &&                         // skip price lines
      !/^\d[\d,.]+ (ratings?|reviews?|stars?)/.test(l) && // skip rating lines
      !/\d+[kK]\+? bought/i.test(l)                    // skip purchase volume
    )
    .slice(0, 6)
}

function topFeature(bullets: string): string {
  return extractFeatures(bullets)[0] ?? ''
}

function keywordsFromBullets(bullets: string, title: string): string[] {
  const words = (bullets + ' ' + title)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
  const stopWords = new Set(['with', 'from', 'this', 'that', 'have', 'your', 'more', 'than', 'just', 'also', 'into', 'will', 'each', 'both', 'about', 'been', 'they'])
  const freq: Record<string, number> = {}
  for (const w of words) {
    if (!stopWords.has(w)) freq[w] = (freq[w] ?? 0) + 1
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w)
}

// ─── Copy formulas ────────────────────────────────────────────
const categoryHooks: Record<string, string[]> = {
  'Amazon Finds': [
    'The Amazon find everyone is sharing right now',
    'This is exactly why people can\'t stop buying from Amazon',
    'Found it, ordered it, obsessed — this one is the real deal',
  ],
  'Home & Kitchen': [
    'The kitchen upgrade that actually makes a difference',
    'Why this is the most-ordered home item right now',
    'Home improvement that pays for itself the first week',
  ],
  'Outdoor & Seasonal': [
    'The outdoor essential that sells out every season',
    'Built for the outdoors — designed to outlast the rest',
    'This seasonal find is going fast for a reason',
  ],
  'Beach Bag Essentials': [
    'The beach bag find people are ordering before summer ends',
    'Going to the beach? This one belongs in your bag',
    'Beach-ready and budget-friendly — this one\'s going viral',
  ],
  'Viral Drinkware': [
    'The drinkware everyone keeps their eye on right now',
    'Hydration upgrade that\'s worth every penny',
    'Why this cup keeps selling out — it\'s actually that good',
  ],
  'Travel + Vacation Finds': [
    'The travel essential that makes every trip easier',
    'Travelers are adding this to their packing list for a reason',
    'Smart travel find that goes with you everywhere',
  ],
  'Under $25': [
    'Under $25 and it actually works — that\'s rare',
    'Budget find that punches way above its price tag',
    'The best $25 you\'ll spend this month',
  ],
}

function pickHook(category: string, monthly_purchases?: string): string {
  const purchases = monthly_purchases ? parseInt(monthly_purchases, 10) : 0
  if (purchases >= 30000) {
    return `${(purchases / 1000).toFixed(0)}K+ people bought this last month — here's why`
  }
  if (purchases >= 10000) {
    return `${(purchases / 1000).toFixed(0)}K+ buyers can't be wrong — this one delivers`
  }
  const hooks = categoryHooks[category] ?? categoryHooks['Amazon Finds']
  return hooks[Math.floor(Math.random() * hooks.length)]
}

function buildTitle(raw: string, bullets: string, category: string): string {
  if (raw.trim()) return raw.trim()
  const feature = topFeature(bullets)
  if (feature) {
    return feature.length > 60 ? feature.slice(0, 57) + '…' : feature
  }
  return `${category} Find`
}

function buildShortDescription(title: string, features: string[], category: string, purchases?: string): string {
  const p = purchases ? parseInt(purchases, 10) : 0
  const social = p >= 10000 ? ` — ${(p / 1000).toFixed(0)}K+ bought last month` : ''
  if (features.length >= 2) {
    const f1 = features[0].toLowerCase()
    const f2 = features[1].toLowerCase()
    return `${capitalize(f1)} and ${f2}${social}.`
  }
  if (features.length === 1) {
    return `${capitalize(features[0])}${social}.`
  }
  return `A top-rated ${category.toLowerCase()} find worth every penny${social}.`
}

function buildMainBenefit(features: string[]): string {
  if (!features.length) return 'Delivers real results without the hassle.'
  const f = features[0]
  return `${capitalize(f).replace(/\.$/, '')} — so you get more done without the extra effort.`
}

function buildBestAudience(category: string, features: string[]): string {
  const audienceMap: Record<string, string> = {
    'Amazon Finds': 'Anyone who wants to spend smarter and shop better',
    'Home & Kitchen': 'Home cooks and anyone who wants a more organized kitchen',
    'Outdoor & Seasonal': 'Outdoor enthusiasts who want gear that keeps up with them',
    'Beach Bag Essentials': 'Beach lovers and summer trip planners',
    'Viral Drinkware': 'Hydration-focused people who want style and function',
    'Travel + Vacation Finds': 'Frequent travelers and weekend getaway planners',
    'Under $25': 'Budget-conscious shoppers who refuse to compromise on quality',
  }
  return audienceMap[category] ?? 'Anyone who values quality, convenience, and smart spending.'
}

function buildProblemSolved(features: string[], category: string): string {
  if (!features.length) {
    return `The frustrating search for a reliable ${category.toLowerCase()} product — solved.`
  }
  const f = features[0].toLowerCase()
  return `No more struggling to find something that actually ${f.includes('easy') || f.includes('simple') ? 'works' : 'delivers'}. This does the job right.`
}

function buildTrustNote(): string {
  return 'Amazon handles checkout, shipping, and returns — you shop with full buyer protection.'
}

function buildProductSummary(title: string, features: string[], category: string): string {
  const feat = features.slice(0, 3)
  if (feat.length >= 2) {
    return `${title} is a top-rated ${category.toLowerCase()} find designed for people who want results. It delivers ${feat[0].toLowerCase()} and ${feat[1].toLowerCase()}, making it one of the most practical choices on Amazon right now.`
  }
  return `${title} is a curated ${category.toLowerCase()} pick selected for quality and real-world usefulness. A smart add-to-cart for anyone looking for something that actually works.`
}

function buildSeoTitle(title: string, category: string): string {
  const base = `${title} | Shop on Amazon via TikTokShop.art`
  return base.length > 60 ? `${title.slice(0, 40)} — Best ${category} Pick` : base
}

function buildSeoDescription(title: string, features: string[], category: string, price?: string): string {
  const priceStr = price ? ` Starting at $${price}.` : ''
  const feat = features[0] ? ` Features: ${features[0].toLowerCase()}.` : ''
  const base = `Shop ${title} on Amazon via TikTokShop.art.${feat}${priceStr} Curated ${category.toLowerCase()} finds — real links, real reviews.`
  return base.length > 160 ? base.slice(0, 157) + '…' : base
}

function buildPinterestTitle(title: string, category: string): string {
  const short = title.length > 40 ? title.slice(0, 37) + '…' : title
  return `${short} | ${category} Must-Have`
}

function buildPinterestDescription(title: string, features: string[], category: string, hook: string): string {
  const feat = features[0] ? ` ${capitalize(features[0])}.` : ''
  return `${hook}.${feat} Shop ${title} on Amazon — hand-picked ${category.toLowerCase()} find. Link in bio or tap to shop. #AmazonFinds #${category.replace(/[^a-z0-9]/gi, '')} #TikTokMadeMeBuyIt`
}

function buildDemandNote(purchases?: string, rating?: string, reviews?: string): string {
  const parts: string[] = []
  if (purchases && parseInt(purchases, 10) >= 10000) {
    parts.push(`${(parseInt(purchases, 10) / 1000).toFixed(0)}K+ purchases/month on Amazon`)
  }
  if (rating) parts.push(`${rating}/5 star rating`)
  if (reviews && parseInt(reviews, 10) > 100) {
    parts.push(`${parseInt(reviews, 10).toLocaleString()} verified reviews`)
  }
  if (!parts.length) return ''
  return `Verified: ${parts.join(' · ')}.`
}

function buildTags(title: string, category: string, bullets: string): string {
  const keywords = keywordsFromBullets(bullets, title)
  const categoryTags = category.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean)
  const allTags = [...new Set([...keywords.slice(0, 6), ...categoryTags, 'amazon', 'amazonfinds'])]
  return allTags.slice(0, 10).join(', ')
}

// ─── Capitalize helper ─────────────────────────────────────────
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Main generator ───────────────────────────────────────────
function generateAll(input: GenerateRequest): Record<string, string> {
  const features = extractFeatures(input.bullets ?? '')
  const title = buildTitle(input.title ?? '', input.bullets ?? '', input.category ?? 'Amazon Finds')
  const category = input.category ?? 'Amazon Finds'
  const hook = pickHook(category, input.monthly_purchases)

  return {
    short_description: buildShortDescription(title, features, category, input.monthly_purchases),
    why_trending: hook,
    main_benefit: buildMainBenefit(features),
    best_audience: buildBestAudience(category, features),
    problem_solved: buildProblemSolved(features, category),
    trust_notes: buildTrustNote(),
    product_summary: buildProductSummary(title, features, category),
    seo_title: buildSeoTitle(title, category),
    seo_description: buildSeoDescription(title, features, category, input.price),
    pinterest_title: buildPinterestTitle(title, category),
    pinterest_description: buildPinterestDescription(title, features, category, hook),
    demand_note: buildDemandNote(input.monthly_purchases, input.rating, input.reviews),
    tags: buildTags(title, category, input.bullets ?? ''),
  }
}

// ─── Route ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: GenerateRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const type = body.type ?? 'all'
  const all = generateAll(body)

  // Return only the requested fields
  const typeMap: Record<string, (keyof typeof all)[]> = {
    all: Object.keys(all) as (keyof typeof all)[],
    viral: ['short_description', 'why_trending'],
    seo: ['seo_title', 'seo_description'],
    pinterest: ['pinterest_title', 'pinterest_description'],
    summary: ['product_summary', 'trust_notes'],
    short_description: ['short_description'],
  }

  const keys = typeMap[type] ?? typeMap.all
  const fields: Record<string, string> = {}
  for (const k of keys) fields[k] = all[k] ?? ''

  return NextResponse.json({ fields })
}
