'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink, Loader2, Sparkles } from 'lucide-react'

interface Props {
  productId: string
  title: string
  category?: string | null
  description?: string | null
  selling_price?: number | null
  tags?: string[] | null
  why_trending?: string | null
  main_benefit?: string | null
  tiktok_shop_url?: string | null
  tiktok_ready?: boolean
  tiktok_hooks?: string[] | null
  tiktok_captions?: string[] | null
  tiktok_benefit_bullets?: string[] | null
  video_script?: string | null
  tiktok_hashtags?: string | null
  viral_score?: number
  content_potential_score?: number
}

export function TikTokProductPanel({
  productId,
  title,
  category,
  description,
  selling_price,
  tags,
  why_trending,
  main_benefit,
  tiktok_shop_url: initialUrl,
  tiktok_ready: initialReady,
  tiktok_hooks: initialHooks,
  tiktok_captions: initialCaptions,
  tiktok_benefit_bullets: initialBullets,
  video_script: initialScript,
  tiktok_hashtags: initialHashtags,
  viral_score: initialViralScore,
  content_potential_score: initialContentScore,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [tiktokUrl, setTiktokUrl] = useState(initialUrl ?? '')
  const [tiktokReady, setTiktokReady] = useState(initialReady ?? false)
  const [contentScore, setContentScore] = useState(initialContentScore ?? 0)
  const [hooks, setHooks] = useState<string[]>(initialHooks ?? [])
  const [captions, setCaptions] = useState<string[]>(initialCaptions ?? [])
  const [bullets, setBullets] = useState<string[]>(initialBullets ?? [])
  const [script, setScript] = useState(initialScript ?? '')
  const [hashtags, setHashtags] = useState(initialHashtags ?? '')
  const [viralScore, setViralScore] = useState(initialViralScore ?? 0)

  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [msg, setMsg] = useState('')

  async function saveFields() {
    setSaving(true)
    setMsg('')
    await supabase.from('products').update({
      tiktok_shop_url: tiktokUrl || null,
      tiktok_ready: tiktokReady,
      content_potential_score: contentScore,
      tiktok_hooks: hooks.length ? hooks : null,
      tiktok_captions: captions.length ? captions : null,
      tiktok_benefit_bullets: bullets.length ? bullets : null,
      video_script: script || null,
      tiktok_hashtags: hashtags || null,
      updated_at: new Date().toISOString(),
    }).eq('id', productId)
    setSaving(false)
    setMsg('Saved.')
    router.refresh()
  }

  async function generateContent() {
    setGenerating(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/generate-tiktok-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, description, selling_price, tags, why_trending, main_benefit }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as {
        hooks: string[]
        captions: string[]
        benefit_bullets: string[]
        video_script: string
        hashtags: string
      }
      setHooks(data.hooks ?? [])
      setCaptions(data.captions ?? [])
      setBullets(data.benefit_bullets ?? [])
      setScript(data.video_script ?? '')
      setHashtags(data.hashtags ?? '')
      setMsg('Content generated — review then save.')
    } catch (err) {
      setMsg(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setGenerating(false)
    }
  }

  async function calcViralScore() {
    setSaving(true)
    const { data: p } = await supabase
      .from('products')
      .select('views_count, purchase_count, margin_percent, selling_price, landed_cost, shipping_cost, handling_days_max, delivery_days_max, monthly_purchases, amazon_rating')
      .eq('id', productId)
      .single()

    if (!p) { setSaving(false); return }

    const { calcViralScore: calc } = await import('@/lib/scoring/viral-score')
    const result = calc({
      views_count: p.views_count,
      purchase_count: p.purchase_count,
      margin_percent: p.margin_percent,
      selling_price: p.selling_price,
      landing_cost: p.landed_cost,
      shipping_cost: p.shipping_cost,
      handling_days_max: p.handling_days_max,
      delivery_days_max: p.delivery_days_max,
      monthly_purchases: p.monthly_purchases,
      amazon_rating: p.amazon_rating,
      content_potential_score: contentScore,
    })

    await supabase.from('products').update({
      viral_score: result.total,
      content_potential_score: contentScore,
    }).eq('id', productId)

    setViralScore(result.total)
    setSaving(false)
    setMsg(`Viral score: ${result.total}/100`)
  }

  const scoreColor = viralScore >= 70 ? 'text-green-600' : viralScore >= 40 ? 'text-yellow-600' : 'text-gray-400'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">TikTok Shop</h3>
        <span className={`text-sm font-bold ${scoreColor}`}>
          Viral Score: {viralScore}/100
        </span>
      </div>

      {/* TikTok Shop URL */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">TikTok Shop Product URL</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={tiktokUrl}
            onChange={e => setTiktokUrl(e.target.value)}
            placeholder="https://www.tiktok.com/..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          {tiktokUrl && (
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs text-pink-600 hover:bg-pink-50"
            >
              <ExternalLink className="h-3 w-3" /> Open
            </a>
          )}
        </div>
      </div>

      {/* TikTok Ready + Content Potential */}
      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={tiktokReady}
            onChange={e => setTiktokReady(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
          />
          <span className="text-sm font-medium text-gray-700">TikTok Ready</span>
        </label>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Content Potential (0–15)</label>
          <input
            type="number"
            min={0}
            max={15}
            value={contentScore}
            onChange={e => setContentScore(parseInt(e.target.value, 10) || 0)}
            className="w-16 rounded border border-gray-200 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button
            onClick={calcViralScore}
            disabled={saving}
            className="rounded-lg bg-pink-50 border border-pink-200 px-3 py-1.5 text-xs font-medium text-pink-700 hover:bg-pink-100 disabled:opacity-50"
          >
            Recalculate Score
          </button>
        </div>
      </div>

      {/* Generate content */}
      <div>
        <button
          onClick={generateContent}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-500 disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate TikTok Content
        </button>
        <p className="mt-1 text-xs text-gray-400">Uses AI to write hooks, captions, video script, and hashtags.</p>
      </div>

      {/* Hooks */}
      {hooks.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">TikTok Hooks</p>
          <div className="space-y-1.5">
            {hooks.map((h, i) => (
              <input
                key={i}
                type="text"
                value={h}
                onChange={e => setHooks(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            ))}
          </div>
        </div>
      )}

      {/* Captions */}
      {captions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Captions</p>
          <div className="space-y-1.5">
            {captions.map((c, i) => (
              <textarea
                key={i}
                rows={2}
                value={c}
                onChange={e => setCaptions(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            ))}
          </div>
        </div>
      )}

      {/* Benefit bullets */}
      {bullets.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Benefit Bullets</p>
          <div className="space-y-1.5">
            {bullets.map((b, i) => (
              <input
                key={i}
                type="text"
                value={b}
                onChange={e => setBullets(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            ))}
          </div>
        </div>
      )}

      {/* Video script */}
      {script && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Video Script</p>
          <textarea
            rows={5}
            value={script}
            onChange={e => setScript(e.target.value)}
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>
      )}

      {/* Hashtags */}
      {hashtags && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Hashtags</p>
          <input
            type="text"
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={saveFields}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save TikTok Fields'}
        </button>
        {msg && <span className={`text-xs ${msg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{msg}</span>}
      </div>
    </div>
  )
}
