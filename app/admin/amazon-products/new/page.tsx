'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2, XCircle, AlertCircle, Sparkles,
  Loader2, Pencil, ChevronDown, ChevronRight, RefreshCw, ClipboardCopy,
} from 'lucide-react'
import { analyzeAmazonUrl, type AmazonUrlAnalysis } from '@/lib/utils/amazon-url'

// Inline type — avoids importing from route file (Next.js app dir boundary)
interface AmazonScrapeResult {
  asin: string | null; title: string; images: string[]; mainImage: string
  price: string; priceRange: string; rating: string; reviewCount: string
  bullets: string; brand: string; variants: { label: string; asin: string; price: string; image: string }[]
  finalUrl: string; blocked: boolean; error?: string
}

interface CapturedAmazonData {
  title?: string
  canonicalUrl?: string
  asin?: string
  price?: string
  rating?: string
  reviewCount?: string
  monthlyPurchases?: string
  brand?: string
  breadcrumbs?: string
  mainImageUrl?: string
  additionalImages?: string[]
  allImages?: string[]
  bullets?: string
  amazonChoice?: string | null
  stock?: string | null
  shipping?: string | null
  capturedAt?: string
  source?: string
}

// Browser console snippet — paste this on any Amazon product page
const CONSOLE_SNIPPET = `(function(){
  var d=document;
  var title=(d.getElementById('productTitle')||{innerText:''}).innerText.trim();
  var canonical=(d.querySelector('link[rel="canonical"]')||{href:location.href}).href;
  var asinM=canonical.match(/\\/dp\\/([A-Z0-9]{10})/i)||location.href.match(/\\/dp\\/([A-Z0-9]{10})/i);
  var asin=asinM?asinM[1]:null;
  var priceEl=d.querySelector('.a-price .a-offscreen');
  var price=priceEl?(priceEl.textContent||'').replace(/[^0-9.]/g,''):'';
  var ratingEl=d.querySelector('#acrPopover .a-size-medium')||d.querySelector('[data-hook="average-star-rating"] .a-size-medium');
  var ratingM=(ratingEl?ratingEl.innerText:'').match(/[\\d.]+/);
  var rating=ratingM?ratingM[0]:'';
  var reviewEl=d.getElementById('acrCustomerReviewText');
  var reviewCount=reviewEl?(reviewEl.innerText||'').replace(/[^0-9]/g,''):'';
  var buySpans=Array.from(d.querySelectorAll('span')).filter(function(s){return /bought in past month/i.test(s.innerText)});
  var monthlyPurchases=buySpans.length?buySpans[0].innerText.replace(/\\s+bought.*/i,'').trim():'';
  var brandEl=d.getElementById('bylineInfo');
  var brand=brandEl?(brandEl.innerText||'').replace(/^(Brand:|Visit the\\s*)/i,'').replace(/\\s*Store$/i,'').trim():'';
  var breadcrumbs=Array.from(d.querySelectorAll('#wayfinding-breadcrumbs_feature_div li')).map(function(l){return l.innerText.trim()}).filter(Boolean).join(' > ');
  var mainImg=d.getElementById('landingImage');
  var mainImageUrl=mainImg?(mainImg.getAttribute('data-old-hires')||mainImg.src||''):'';
  var thumbs=Array.from(d.querySelectorAll('#altImages img'));
  var extraImages=thumbs.map(function(img){return(img.getAttribute('data-old-hires')||img.src||'').replace(/\\._(\\w+)_\\.jpg/i,'._SL1500_.jpg')}).filter(function(s){return s.includes('media-amazon.com')&&!s.includes('._SS')&&!s.includes('._US')});
  var allImages=[mainImageUrl].concat(extraImages).filter(function(u,i,a){return u&&a.indexOf(u)===i}).slice(0,10);
  var bulletEls=Array.from(d.querySelectorAll('#feature-bullets .a-list-item'));
  var bullets=bulletEls.map(function(b){return '\\u2022 '+b.innerText.trim()}).filter(function(b){return b.length>4}).join('\\n');
  var acEl=d.querySelector('.ac-badge-wrapper .ac-keyword-link')||d.querySelector('[id*="acBadge"]');
  var amazonChoice=acEl?acEl.innerText.trim():null;
  var stockEl=d.getElementById('availability');
  var stock=stockEl?stockEl.innerText.trim():null;
  var shippingEl=d.getElementById('deliveryBlockMessage')||d.getElementById('delivery-message');
  var shipping=shippingEl?shippingEl.innerText.trim():null;
  var result={title:title,canonicalUrl:canonical,asin:asin,price:price,rating:rating,reviewCount:reviewCount,monthlyPurchases:monthlyPurchases,brand:brand,breadcrumbs:breadcrumbs,mainImageUrl:mainImageUrl,additionalImages:allImages.slice(1),allImages:allImages,bullets:bullets,amazonChoice:amazonChoice||null,stock:stock||null,shipping:shipping||null,capturedAt:new Date().toISOString(),source:'ViralVault Capture v1'};
  var json=JSON.stringify(result,null,2);
  navigator.clipboard.writeText(json).then(function(){alert('Copied! Go back to ViralVault and paste into the capture box.');}).catch(function(){var t=d.createElement('textarea');t.value=json;d.body.appendChild(t);t.select();d.execCommand('copy');d.body.removeChild(t);alert('Copied! Go back to ViralVault and paste into the capture box.');});
})();`

const CATEGORIES = [
  'Amazon Finds', 'Beach Bag Essentials', 'Home & Kitchen',
  'Outdoor & Seasonal', 'Travel + Vacation Finds', 'Viral Drinkware', 'Under $25',
]

type Phase = 'input' | 'loading' | 'review'

interface LoadStep { label: string; done: boolean; note?: string }

interface Draft {
  title: string; category: string; short_description: string
  hero_image_url: string; selling_price: string; amazon_rating: string
  amazon_review_count: string; monthly_purchases: string; demand_note: string
  why_trending: string; main_benefit: string; best_audience: string
  problem_solved: string; trust_notes: string; product_summary: string
  seo_title: string; seo_description: string
  pinterest_title: string; pinterest_description: string
  bullets: string; tags: string
}

const EMPTY: Draft = {
  title: '', category: 'Amazon Finds', short_description: '',
  hero_image_url: '', selling_price: '', amazon_rating: '',
  amazon_review_count: '', monthly_purchases: '', demand_note: '',
  why_trending: '', main_benefit: '', best_audience: '', problem_solved: '',
  trust_notes: '', product_summary: '', seo_title: '', seo_description: '',
  pinterest_title: '', pinterest_description: '', bullets: '', tags: '',
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AmazonAnalyzerPage() {
  const router = useRouter()
  const supabase = createClient()

  const [defaultTag, setDefaultTag] = useState('zoeherstich-20')
  const [inputUrl, setInputUrl] = useState('')
  const [phase, setPhase] = useState<Phase>('input')
  const [loadSteps, setLoadSteps] = useState<LoadStep[]>([])
  const [analysis, setAnalysis] = useState<AmazonUrlAnalysis | null>(null)
  const [scrapeResult, setScrapeResult] = useState<AmazonScrapeResult | null>(null)
  const [allImages, setAllImages] = useState<string[]>([])
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [genError, setGenError] = useState('')
  const [scrapeBlocked, setScrapeBlocked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [editingField, setEditingField] = useState<keyof Draft | null>(null)
  const [regenLoading, setRegenLoading] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)

  // Capture flow state
  const [captureJson, setCaptureJson] = useState('')
  const [captureError, setCaptureError] = useState('')
  const [captureLoading, setCaptureLoading] = useState(false)
  const [snippetCopied, setSnippetCopied] = useState(false)
  const [showCaptureSnippet, setShowCaptureSnippet] = useState(false)
  const [blockedNoData, setBlockedNoData] = useState(false)

  useEffect(() => {
    supabase.from('amazon_settings').select('default_amazon_tracking_id').limit(1).single()
      .then(({ data }) => { if (data?.default_amazon_tracking_id) setDefaultTag(data.default_amazon_tracking_id) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof Draft, v: string) => setDraft(d => ({ ...d, [k]: v }))

  // ── Copy snippet to clipboard ──────────────────────────────
  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(CONSOLE_SNIPPET)
      setSnippetCopied(true)
      setTimeout(() => setSnippetCopied(false), 2500)
    } catch { /* ignore */ }
  }

  // ── Fill from browser-captured JSON ───────────────────────
  async function fillFromCapture() {
    setCaptureError('')
    let captured: CapturedAmazonData
    try {
      captured = JSON.parse(captureJson) as CapturedAmazonData
    } catch {
      setCaptureError('Invalid JSON — make sure you copied the full output from the browser snippet.')
      return
    }

    const urlToAnalyze = captured.canonicalUrl
      || (captured.asin ? `https://www.amazon.com/dp/${captured.asin}` : '')

    if (!urlToAnalyze) {
      setCaptureError('No URL or ASIN found in captured data. Make sure you ran the snippet on an Amazon product page.')
      return
    }

    setCaptureLoading(true)

    const urlResult = analyzeAmazonUrl(urlToAnalyze, defaultTag)
    setAnalysis(urlResult)
    setInputUrl(urlToAnalyze)

    const images = (captured.allImages ?? []).filter(Boolean)
    if (images.length) setAllImages(images)

    // Synthesize a scrape result from captured data so the review strip renders correctly
    const syntheticScrape: AmazonScrapeResult = {
      asin: captured.asin ?? urlResult.asin ?? null,
      title: captured.title ?? '',
      images,
      mainImage: captured.mainImageUrl ?? images[0] ?? '',
      price: captured.price ?? '',
      priceRange: '',
      rating: captured.rating ?? '',
      reviewCount: captured.reviewCount ?? '',
      bullets: captured.bullets ?? '',
      brand: captured.brand ?? '',
      variants: [],
      finalUrl: captured.canonicalUrl ?? urlToAnalyze,
      blocked: false,
    }
    setScrapeResult(syntheticScrape)
    setScrapeBlocked(false)

    // Show loading phase for the generate step
    const steps: LoadStep[] = [
      { label: 'Product data captured from your browser', done: true },
      { label: 'Generating SEO & sales copy', done: false },
    ]
    setLoadSteps(steps)
    setPhase('loading')

    try {
      const res = await fetch('/api/admin/generate-product-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: captured.title ?? '',
          category: 'Amazon Finds',
          bullets: captured.bullets ?? '',
          price: captured.price ?? '',
          rating: captured.rating ?? '',
          reviews: captured.reviewCount ?? '',
          monthly_purchases: captured.monthlyPurchases ?? '',
          type: 'all',
        }),
      })
      const genData = await res.json()
      steps[1] = { ...steps[1], done: true }
      setLoadSteps([...steps])

      setDraft({
        ...EMPTY,
        title: captured.title ?? '',
        category: 'Amazon Finds',
        hero_image_url: captured.mainImageUrl ?? images[0] ?? '',
        selling_price: captured.price ?? '',
        amazon_rating: captured.rating ?? '',
        amazon_review_count: captured.reviewCount ?? '',
        monthly_purchases: captured.monthlyPurchases ?? '',
        bullets: captured.bullets ?? '',
        demand_note: captured.amazonChoice ? `Amazon's Choice: ${captured.amazonChoice}` : '',
        ...(genData.fields ?? {}),
      })
    } catch {
      steps[1] = { ...steps[1], done: true }
      setLoadSteps([...steps])
      setGenError('Copy generation failed — fill fields manually or try Regenerate.')
      setDraft({
        ...EMPTY,
        title: captured.title ?? '',
        hero_image_url: captured.mainImageUrl ?? images[0] ?? '',
        selling_price: captured.price ?? '',
        amazon_rating: captured.rating ?? '',
        amazon_review_count: captured.reviewCount ?? '',
        monthly_purchases: captured.monthlyPurchases ?? '',
        bullets: captured.bullets ?? '',
        demand_note: captured.amazonChoice ? `Amazon's Choice: ${captured.amazonChoice}` : '',
      })
    }

    setCaptureLoading(false)
    setPhase('review')
  }

  // ── Main: scrape → generate ────────────────────────────────
  async function analyzeAndGenerate() {
    if (!inputUrl.trim()) return
    setGenError('')
    setScrapeBlocked(false)
    setBlockedNoData(false)
    setPhase('loading')

    const steps: LoadStep[] = [
      { label: 'Normalizing URL', done: false },
      { label: 'Fetching Amazon product page', done: false },
      { label: 'Extracting title, images, price, bullets', done: false },
      { label: 'Generating SEO & sales copy', done: false },
    ]
    setLoadSteps([...steps])

    // Step 1: normalize URL
    const urlResult = analyzeAmazonUrl(inputUrl, defaultTag)
    setAnalysis(urlResult)
    steps[0] = { ...steps[0], done: true }
    setLoadSteps([...steps])

    // Step 2: scrape Amazon
    let scraped: AmazonScrapeResult | null = null
    try {
      const r = await fetch('/api/admin/scrape-amazon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlResult.affiliateUrl || inputUrl }),
      })
      scraped = await r.json()
      setScrapeResult(scraped)
    } catch { /* ignore, continue with empty */ }

    steps[1] = { ...steps[1], done: true, note: scraped?.blocked ? 'Amazon blocked — use browser capture below' : undefined }
    setLoadSteps([...steps])

    const wasBlocked = scraped?.blocked ?? true
    setScrapeBlocked(wasBlocked)

    if (scraped && !wasBlocked) {
      setAllImages(scraped.images ?? [])
    }

    steps[2] = { ...steps[2], done: true }
    setLoadSteps([...steps])

    const hasTitle = !!(scraped?.title)
    const hasAsin = !!(scraped?.asin ?? urlResult.asin)

    // If blocked and we got nothing useful, don't show an empty review form.
    // Send the user back to input with browser capture highlighted.
    if (wasBlocked && !hasTitle && !hasAsin) {
      setBlockedNoData(true)
      setShowCaptureSnippet(false)
      setPhase('input')
      return
    }

    const bulletsForGen = scraped?.bullets ?? ''
    const titleForGen = scraped?.title ?? ''

    try {
      const res = await fetch('/api/admin/generate-product-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleForGen,
          category: 'Amazon Finds',
          bullets: bulletsForGen,
          price: scraped?.price ?? '',
          rating: scraped?.rating ?? '',
          reviews: scraped?.reviewCount ?? '',
          type: 'all',
        }),
      })
      const genData = await res.json()
      steps[3] = { ...steps[3], done: true }
      setLoadSteps([...steps])

      setDraft({
        ...EMPTY,
        title: scraped?.title ?? '',
        category: 'Amazon Finds',
        hero_image_url: scraped?.mainImage ?? '',
        selling_price: scraped?.price ?? '',
        amazon_rating: scraped?.rating ?? '',
        amazon_review_count: scraped?.reviewCount ?? '',
        bullets: bulletsForGen,
        ...(genData.fields ?? {}),
      })
    } catch (err: unknown) {
      steps[3] = { ...steps[3], done: true }
      setLoadSteps([...steps])
      setGenError(err instanceof Error ? err.message : 'Copy generation failed')
      setDraft({
        ...EMPTY,
        title: scraped?.title ?? '',
        hero_image_url: scraped?.mainImage ?? '',
        selling_price: scraped?.price ?? '',
        amazon_rating: scraped?.rating ?? '',
        amazon_review_count: scraped?.reviewCount ?? '',
        bullets: bulletsForGen,
      })
    }

    setPhase('review')
  }

  // ── Re-scrape ─────────────────────────────────────────────
  async function reScrape() {
    setRegenLoading(true)
    try {
      const r = await fetch('/api/admin/scrape-amazon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: analysis?.affiliateUrl || inputUrl }),
      })
      const scraped: AmazonScrapeResult = await r.json()
      setScrapeResult(scraped)
      setScrapeBlocked(scraped.blocked)
      if (!scraped.blocked) {
        setAllImages(scraped.images ?? [])
        if (scraped.title) set('title', scraped.title)
        if (scraped.mainImage && !draft.hero_image_url) set('hero_image_url', scraped.mainImage)
        if (scraped.price) set('selling_price', scraped.price)
        if (scraped.rating) set('amazon_rating', scraped.rating)
        if (scraped.reviewCount) set('amazon_review_count', scraped.reviewCount)
        if (scraped.bullets) set('bullets', scraped.bullets)
      }
    } catch { /* ignore */ }
    setRegenLoading(false)
  }

  // ── Regen copy ────────────────────────────────────────────
  async function regen(type: 'all' | 'seo' | 'viral' | 'pinterest' | 'summary') {
    setRegenLoading(true)
    setGenError('')
    try {
      const res = await fetch('/api/admin/generate-product-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title, category: draft.category, bullets: draft.bullets,
          price: draft.selling_price, rating: draft.amazon_rating,
          reviews: draft.amazon_review_count, monthly_purchases: draft.monthly_purchases,
          type,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDraft(d => ({ ...d, ...data.fields }))
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Regeneration failed.')
    } finally {
      setRegenLoading(false)
    }
  }

  // ── Save ─────────────────────────────────────────────────
  async function save() {
    if (!analysis?.affiliateUrl) return
    setSaving(true)
    setSaveError('')
    const title = draft.title.trim() || 'Amazon Affiliate Draft'
    const slug = slugify(title) + '-' + Date.now().toString(36)
    const { data, error } = await supabase.from('products').insert({
      title, slug, category: draft.category,
      short_description: draft.short_description || null,
      description: draft.product_summary || null,
      hero_image_url: draft.hero_image_url || null,
      selling_price: draft.selling_price ? parseFloat(draft.selling_price) : null,
      tags: draft.tags ? draft.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      amazon_affiliate_url: analysis.affiliateUrl,
      amazon_product_url: analysis.cleanProductUrl ?? analysis.affiliateUrl,
      amazon_tracking_id: analysis.trackingId,
      why_trending: draft.why_trending || null,
      best_for: draft.best_audience || null,
      problem_solved: draft.problem_solved || null,
      trust_notes: draft.trust_notes || null,
      product_summary: draft.product_summary || null,
      seo_title: draft.seo_title || null,
      seo_description: draft.seo_description || null,
      pinterest_title: draft.pinterest_title || null,
      pinterest_description: draft.pinterest_description || null,
      product_type: 'amazon_affiliate',
      fulfillment_responsibility: 'marketplace_seller',
      marketplace: 'Amazon',
      affiliate_network: 'Amazon Associates',
      affiliate_disclosure_enabled: true,
      cta_text: 'View on Amazon',
      verification_status: 'Source Found',
      published: false,
      status: 'Researching',
      approval_status: 'Not Approved',
      affiliate_click_count: 0,
    }).select('id').single()
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    router.push(`/admin/products/${data.id}`)
  }

  // ── Readiness ─────────────────────────────────────────────
  const checks = [
    { label: 'Affiliate URL', ok: !!analysis?.affiliateUrl },
    { label: 'Title', ok: !!draft.title.trim() },
    { label: 'Category', ok: !!draft.category },
    { label: 'Short description', ok: !!draft.short_description.trim() },
    { label: 'Viral hook', ok: !!draft.why_trending.trim() },
    { label: 'Hero image', ok: !!draft.hero_image_url },
    { label: 'Disclosure', ok: true },
    { label: 'CTA = View on Amazon', ok: true },
  ]
  const canSave = !!analysis?.affiliateUrl && !!draft.title.trim() && !!draft.short_description.trim()

  const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'
  const labelCls = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400'

  const reviewField = (key: keyof Draft, label: string, opts: { rows?: number; placeholder?: string; hint?: string } = {}) => {
    const val = draft[key] as string
    const isEditing = editingField === key
    return (
      <div className="group relative border-b border-gray-50 py-3 last:border-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            {isEditing ? (
              opts.rows
                ? <textarea autoFocus value={val} onChange={e => set(key, e.target.value)} onBlur={() => setEditingField(null)} rows={opts.rows} className="w-full rounded-lg border border-violet-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                : <input autoFocus value={val} onChange={e => set(key, e.target.value)} onBlur={() => setEditingField(null)} placeholder={opts.placeholder} className="w-full rounded-lg border border-violet-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            ) : (
              <p className={`text-sm leading-relaxed ${val ? 'cursor-pointer text-gray-800 hover:text-violet-700' : 'italic text-gray-300'}`} onClick={() => setEditingField(key)}>
                {val || opts.placeholder || 'Click to edit'}
              </p>
            )}
            {opts.hint && <p className="mt-1 text-xs text-gray-400">{opts.hint}</p>}
          </div>
          <button type="button" onClick={() => setEditingField(isEditing ? null : key)} className="mt-5 shrink-0 rounded p-1 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-violet-500">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // ─── PHASE: input ─────────────────────────────────────────
  if (phase === 'input') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-start bg-gray-50 px-4 py-16">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Add Amazon Product</h1>
            <p className="mt-1 text-sm text-gray-500">
              Paste an Amazon link → app fetches product data → AI generates copy → Review & save
            </p>
          </div>

          {/* ── Blocked banner ───────────────────────────── */}
          {blockedNoData && (
            <div className="mb-6 rounded-xl border-2 border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <strong className="text-red-900">Amazon blocked the server scrape — no product data was retrieved.</strong>
                  <p className="mt-1 text-xs text-red-700">
                    Amazon blocks Vercel&apos;s server IPs. Your browser can see the page just fine.
                    Use <strong>Browser Capture</strong> below to pull all the product data automatically — no manual entry needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Option 1: Paste Link ──────────────────────── */}
          <div className="mb-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-xs text-violet-800">
            <strong>SiteStripe link:</strong> Log into Amazon Associates, go to any product page, use
            the SiteStripe bar → Get Link → Text → copy the <code className="rounded bg-violet-100 px-1">https://a.co/d/</code> link.
          </div>

          <div className="rounded-2xl border-2 border-violet-300 bg-white p-6 shadow-sm">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Amazon Product or Affiliate URL
            </label>
            <input
              type="url"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyzeAndGenerate()}
              placeholder="https://a.co/d/xxxxxxx  or  amazon.com/dp/B0..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              autoFocus
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Tag: <code className="rounded bg-gray-100 px-1">{defaultTag}</code> ·{' '}
              <Link href="/admin/settings/amazon" className="text-violet-500 hover:underline">Change in settings</Link>
            </p>
            <button
              type="button"
              onClick={analyzeAndGenerate}
              disabled={!inputUrl.trim()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-4 text-base font-bold text-white shadow transition hover:bg-violet-500 disabled:opacity-40"
            >
              <Sparkles className="h-5 w-5" />
              Analyze Link &amp; Auto-Fill Draft
            </button>
          </div>

          {/* ── Divider ───────────────────────────────────── */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">or use browser capture</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* ── Option 2: Browser Capture ─────────────────── */}
          <div className="rounded-2xl border-2 border-amber-300 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-sm font-bold">!</div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Capture from Amazon Page</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Amazon blocks server IPs. This captures product data directly from your browser — no blocking.
                </p>
              </div>
            </div>

            {/* Steps */}
            <ol className="mb-4 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">1</span>
                Open the Amazon product page in your browser.
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">2</span>
                <span>
                  Open the browser console{' '}
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">F12</span> or{' '}
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">Cmd+Option+J</span>
                  {' '}→ paste the snippet → press Enter.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">3</span>
                The snippet copies product data to your clipboard automatically.
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">4</span>
                Paste the copied JSON into the box below and click Auto-Fill.
              </li>
            </ol>

            {/* Snippet toggle + copy */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowCaptureSnippet(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900"
                >
                  {showCaptureSnippet ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  {showCaptureSnippet ? 'Hide snippet' : 'Show snippet to copy'}
                </button>
                <button
                  type="button"
                  onClick={copySnippet}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  {snippetCopied ? 'Copied!' : 'Copy Snippet'}
                </button>
              </div>

              {showCaptureSnippet && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-gray-900 p-3">
                  <pre className="whitespace-pre-wrap break-all text-xs leading-relaxed text-green-400">{CONSOLE_SNIPPET}</pre>
                </div>
              )}
            </div>

            {/* Paste area */}
            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Paste Captured Amazon JSON
              </label>
              <textarea
                value={captureJson}
                onChange={e => { setCaptureJson(e.target.value); setCaptureError('') }}
                rows={5}
                placeholder={'{\n  "title": "...",\n  "canonicalUrl": "...",\n  ...\n}'}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {captureError && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />{captureError}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={fillFromCapture}
              disabled={!captureJson.trim() || captureLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-4 text-base font-bold text-white shadow transition hover:bg-amber-400 disabled:opacity-40"
            >
              {captureLoading
                ? <><Loader2 className="h-5 w-5 animate-spin" /> Filling…</>
                : <><Sparkles className="h-5 w-5" /> Auto-Fill From Captured Data</>}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link href="/admin/amazon-products/review" className="text-sm text-gray-400 hover:text-gray-600">← Back to products</Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── PHASE: loading ───────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <Loader2 className="mx-auto mb-6 h-10 w-10 animate-spin text-violet-500" />
          <h2 className="mb-6 text-lg font-bold text-gray-900">Building your product draft…</h2>
          <div className="space-y-3 text-left">
            {loadSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                {step.done
                  ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                  : i === loadSteps.findIndex(s => !s.done)
                    ? <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-violet-500" />
                    : <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-gray-200" />}
                <div>
                  <span className={`text-sm ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</span>
                  {step.note && <p className="text-xs text-amber-600">{step.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─── PHASE: review ────────────────────────────────────────
  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Draft</h1>
          <p className="mt-1 text-sm text-gray-500">
            {scrapeBlocked
              ? 'Amazon blocked server capture — use browser capture below to fill missing fields.'
              : `Real Amazon data extracted. ${allImages.length} images found. Click any field to edit.`}
          </p>
        </div>
        <button type="button" onClick={() => { setPhase('input'); setAnalysis(null); setDraft(EMPTY); setGenError(''); setAllImages([]); setBlockedNoData(false) }}
          className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50">
          ← New link
        </button>
      </div>

      {/* Scrape blocked warning — now directs to browser capture */}
      {scrapeBlocked && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <strong>Amazon blocked automatic server capture.</strong>
              <p className="mt-1 text-xs text-amber-700">
                This is normal — Amazon blocks Vercel/server IPs. Use browser capture instead:
              </p>
              <ol className="mt-2 space-y-1 text-xs text-amber-800">
                <li>1. Go back → copy the snippet → open the Amazon page in your browser.</li>
                <li>2. Paste the snippet in the browser console (F12) → press Enter.</li>
                <li>3. Return here → paste the copied JSON → click Auto-Fill.</li>
              </ol>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => { setPhase('input'); setAnalysis(null); setDraft(EMPTY); setGenError(''); setAllImages([]); setBlockedNoData(false) }}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700">
                  Go to Browser Capture
                </button>
                <button type="button" onClick={reScrape} disabled={regenLoading}
                  className="flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50">
                  <RefreshCw className={`h-3 w-3 ${regenLoading ? 'animate-spin' : ''}`} /> Retry server scrape
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis strip */}
      {analysis && (
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-4">
          {[
            { label: 'Link', ok: true, val: analysis.isShortLink ? 'Short link followed' : 'Full URL' },
            { label: 'ASIN', ok: !!scrapeResult?.asin || !!analysis.asin, val: scrapeResult?.asin ?? analysis.asin ?? 'Verify manually' },
            { label: 'Tag', ok: !!analysis.trackingId, val: analysis.trackingId ?? 'None' },
            { label: 'Images', ok: allImages.length > 0, val: allImages.length > 0 ? `${allImages.length} found` : 'None extracted' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-1.5">
              {item.ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" /> : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />}
              <div><p className="text-xs font-semibold text-gray-500">{item.label}</p><p className="text-xs text-gray-700 break-all">{item.val}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Regen buttons */}
      <div className="mb-5 flex flex-wrap gap-2">
        <p className="w-full text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Regenerate Copy</p>
        {(['all', 'viral', 'seo', 'pinterest', 'summary'] as const).map(t => (
          <button key={t} type="button" onClick={() => regen(t)} disabled={regenLoading}
            className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-40">
            {regenLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {t === 'all' ? 'All Fields' : t === 'viral' ? 'Viral Copy' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {genError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="inline h-4 w-4 mr-1" />{genError}
        </div>
      )}

      {/* Bullets paste (always visible, improves copy) */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Product Bullets
            {scrapeResult?.bullets
              ? <span className="ml-2 font-normal normal-case text-green-600">✓ Auto-extracted</span>
              : <span className="ml-2 font-normal normal-case text-gray-400">Paste &quot;About this item&quot; from Amazon</span>}
          </p>
          <button type="button" onClick={() => regen('all')} disabled={regenLoading || !draft.bullets.trim()}
            className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-40">
            {regenLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Re-generate from Bullets
          </button>
        </div>
        <textarea value={draft.bullets} onChange={e => set('bullets', e.target.value)} rows={4}
          placeholder="• Paste Amazon 'About this item' bullets here for better copy..." className={inputCls} />
      </div>

      {/* ── Image picker ──────────────────────────────────── */}
      <div className="mb-5 rounded-xl border border-gray-200 bg-white overflow-hidden">
        <button type="button" onClick={() => setShowImagePicker(v => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Hero Image</span>
            {draft.hero_image_url
              ? <span className="text-xs text-green-600">✓ Selected</span>
              : <span className="text-xs text-red-500">Required</span>}
            {allImages.length > 0 && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">{allImages.length} images found</span>}
          </div>
          {showImagePicker ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </button>

        {showImagePicker && (
          <div className="border-t border-gray-100 p-4 space-y-3">
            <div className="flex gap-2">
              {draft.hero_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.hero_image_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover border border-gray-200"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              )}
              <div className="flex-1">
                <label className={labelCls}>Image URL</label>
                <input value={draft.hero_image_url} onChange={e => set('hero_image_url', e.target.value)}
                  placeholder="Paste image URL or select below" className={inputCls} />
                <p className="mt-1 text-xs text-gray-400">On Amazon: right-click main product photo → Copy image address</p>
              </div>
            </div>

            {allImages.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">Select hero image:</p>
                <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
                  {allImages.map((url, i) => (
                    <button key={i} type="button" onClick={() => set('hero_image_url', url)}
                      className={`relative overflow-hidden rounded-lg border-2 transition ${draft.hero_image_url === url ? 'border-violet-500' : 'border-gray-200 hover:border-violet-300'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Product image ${i + 1}`} className="aspect-square w-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
                      {draft.hero_image_url === url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-violet-500/20">
                          <CheckCircle2 className="h-5 w-5 text-violet-600" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {allImages.length === 0 && !scrapeBlocked && (
              <p className="text-xs text-gray-400">No images found in the page. Paste the image URL above.</p>
            )}
          </div>
        )}
      </div>
      {!showImagePicker && !draft.hero_image_url && (
        <button type="button" onClick={() => setShowImagePicker(true)}
          className="mb-5 w-full rounded-xl border-2 border-dashed border-red-200 bg-red-50 py-3 text-sm font-medium text-red-500 hover:bg-red-100">
          ⚠ Hero image required — click to add
        </button>
      )}

      {/* ── Draft review sections ──────────────────────────── */}
      <div className="space-y-4">

        {/* Required */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className={labelCls}>Required Fields</p>
          {reviewField('title', 'Title', { placeholder: 'Product title from Amazon' })}
          <div className="border-b border-gray-50 py-3">
            <p className={labelCls}>Category</p>
            <select value={draft.category} onChange={e => set('category', e.target.value)} className={inputCls}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {reviewField('short_description', 'Short Description', { rows: 2, placeholder: 'One punchy sentence for product cards' })}
        </div>

        {/* Sales copy */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className={labelCls}>Sales Copy</p>
          {reviewField('why_trending', 'Viral Hook / Sales Angle', { rows: 2 })}
          {reviewField('main_benefit', 'Main Benefit')}
          {reviewField('best_audience', 'Best Audience')}
          {reviewField('problem_solved', 'Problem It Solves')}
          {reviewField('trust_notes', 'Trust Note')}
        </div>

        {/* SEO */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className={labelCls}>SEO & Social</p>
          {reviewField('product_summary', 'Product Summary', { rows: 3 })}
          {reviewField('seo_title', 'SEO Title', { hint: `${draft.seo_title.length}/60 chars` })}
          {reviewField('seo_description', 'SEO Description', { rows: 2, hint: `${draft.seo_description.length}/160 chars` })}
          {reviewField('pinterest_title', 'Pinterest Title')}
          {reviewField('pinterest_description', 'Pinterest Description', { rows: 2 })}
        </div>

        {/* Advanced */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <button type="button" onClick={() => setShowAdvanced(v => !v)}
            className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-gray-50">
            <span className="text-sm font-semibold text-gray-600">
              Verified Amazon Data
              {(draft.selling_price || draft.amazon_rating || draft.monthly_purchases) &&
                <span className="ml-2 text-xs font-normal text-green-600">✓ Some data extracted</span>}
            </span>
            {showAdvanced ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
          </button>
          {showAdvanced && (
            <div className="border-t border-gray-100 px-5 py-4 space-y-3">
              <p className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-800">
                Do not fabricate these values. Only keep what was captured or verified from Amazon directly.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([['Price ($)', 'selling_price'], ['Rating (0–5)', 'amazon_rating'], ['Review Count', 'amazon_review_count'], ['Monthly Purchases', 'monthly_purchases']] as [string, keyof Draft][]).map(([label, key]) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input type="number" value={draft[key] as string} onChange={e => set(key, e.target.value)} className={inputCls} />
                  </div>
                ))}
              </div>
              {reviewField('demand_note', 'Demand Note', { placeholder: 'Verified demand insight only' })}
              <div>
                <label className={labelCls}>Tags</label>
                <input value={draft.tags} onChange={e => set('tags', e.target.value)} placeholder="viral, summer, kitchen" className={inputCls} />
              </div>

              {(scrapeResult?.variants?.length ?? 0) > 0 && (
                <div>
                  <p className={labelCls}>Product Variants (from Amazon)</p>
                  <div className="space-y-1">
                    {scrapeResult!.variants.map((v: { label: string; asin: string }, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                        <span>{v.label}</span>
                        <span className="font-mono text-gray-400">{v.asin}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Each variant needs its own affiliate link to track separately.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Readiness + Save */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className={labelCls}>Readiness Check</p>
          <ul className="mb-5 grid grid-cols-2 gap-1.5">
            {checks.map(r => (
              <li key={r.label} className="flex items-center gap-2 text-xs">
                {r.ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" /> : <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
                <span className={r.ok ? 'text-gray-700' : 'text-red-500'}>{r.label}</span>
              </li>
            ))}
          </ul>

          {saveError && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{saveError}</div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} disabled={saving || !canSave}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-40">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save Draft'}
            </button>
            {!canSave && <p className="text-xs text-orange-600">Title, short description, and affiliate URL are required.</p>}
          </div>
          <p className="mt-2 text-xs text-gray-400">Saves as draft. Mark Live from the product detail page when ready.</p>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/admin/amazon-products/review" className="text-sm text-gray-400 hover:text-gray-600">← Back to products</Link>
      </div>
    </div>
  )
}
