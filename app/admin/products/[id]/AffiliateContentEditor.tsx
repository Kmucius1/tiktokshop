'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pencil, X, Save } from 'lucide-react'

interface AffiliateFields {
  why_trending: string | null
  main_benefit: string | null
  best_audience: string | null
  problem_solved: string | null
  trust_notes: string | null
  demand_note: string | null
  monthly_purchases: number | null
  amazon_rating: number | null
  amazon_review_count: number | null
}

interface Props {
  productId: string
  fields: AffiliateFields
}

export function AffiliateContentEditor({ productId, fields }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    why_trending: fields.why_trending ?? '',
    main_benefit: fields.main_benefit ?? '',
    best_audience: fields.best_audience ?? '',
    problem_solved: fields.problem_solved ?? '',
    trust_notes: fields.trust_notes ?? '',
    demand_note: fields.demand_note ?? '',
    monthly_purchases: fields.monthly_purchases?.toString() ?? '',
    amazon_rating: fields.amazon_rating?.toString() ?? '',
    amazon_review_count: fields.amazon_review_count?.toString() ?? '',
  })

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    setLoading(true)
    await supabase.from('products').update({
      why_trending: form.why_trending.trim() || null,
      main_benefit: form.main_benefit.trim() || null,
      best_audience: form.best_audience.trim() || null,
      problem_solved: form.problem_solved.trim() || null,
      trust_notes: form.trust_notes.trim() || null,
      demand_note: form.demand_note.trim() || null,
      monthly_purchases: form.monthly_purchases ? parseInt(form.monthly_purchases, 10) : null,
      amazon_rating: form.amazon_rating ? parseFloat(form.amazon_rating) : null,
      amazon_review_count: form.amazon_review_count ? parseInt(form.amazon_review_count, 10) : null,
      updated_at: new Date().toISOString(),
    }).eq('id', productId)
    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'
  const labelClass = 'mb-1 block text-xs font-semibold text-gray-600'

  if (!editing) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Content & Demand</h3>
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
            <Pencil className="h-3 w-3" /> Edit
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <Row label="Sales Hook" value={fields.why_trending} />
          <Row label="Main Benefit" value={fields.main_benefit} />
          <Row label="Best Audience" value={fields.best_audience} />
          <Row label="Problem Solved" value={fields.problem_solved} />
          <Row label="Trust Note" value={fields.trust_notes} />
          <div className="border-t border-gray-50 pt-2 mt-2">
            <p className="text-xs font-semibold text-gray-500 mb-2">Amazon Data (verified only)</p>
            <Row label="Price" value={null} />
            <Row label="Rating" value={fields.amazon_rating !== null ? `${fields.amazon_rating}/5` : null} />
            <Row label="Review Count" value={fields.amazon_review_count !== null ? fields.amazon_review_count.toLocaleString() : null} />
            <Row label="Monthly Purchases" value={fields.monthly_purchases !== null ? `${fields.monthly_purchases.toLocaleString()}/mo` : null} />
            <Row label="Demand Note" value={fields.demand_note} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Edit Content & Demand</h3>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className={labelClass}>Sales Hook / Viral Angle</label>
          <input value={form.why_trending} onChange={e => set('why_trending', e.target.value)} className={inputClass} placeholder="Why is this product blowing up?" />
        </div>
        <div>
          <label className={labelClass}>Main Benefit</label>
          <input value={form.main_benefit} onChange={e => set('main_benefit', e.target.value)} className={inputClass} placeholder="The #1 reason someone buys this" />
        </div>
        <div>
          <label className={labelClass}>Best Audience</label>
          <input value={form.best_audience} onChange={e => set('best_audience', e.target.value)} className={inputClass} placeholder="Who is this perfect for?" />
        </div>
        <div>
          <label className={labelClass}>Problem It Solves</label>
          <input value={form.problem_solved} onChange={e => set('problem_solved', e.target.value)} className={inputClass} placeholder="What frustration does this fix?" />
        </div>
        <div>
          <label className={labelClass}>Trust Note</label>
          <input value={form.trust_notes} onChange={e => set('trust_notes', e.target.value)} className={inputClass} placeholder="Amazon handles checkout, shipping, and returns." />
        </div>
        <div className="border-t border-gray-100 pt-3">
          <p className="mb-2 text-xs font-semibold text-amber-700">Amazon Data — Only enter verified numbers. Do not fabricate.</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Rating (0–5)</label>
              <input type="number" step="0.1" min="0" max="5" value={form.amazon_rating} onChange={e => set('amazon_rating', e.target.value)} className={inputClass} placeholder="4.5" />
            </div>
            <div>
              <label className={labelClass}>Review Count</label>
              <input type="number" min="0" value={form.amazon_review_count} onChange={e => set('amazon_review_count', e.target.value)} className={inputClass} placeholder="1234" />
            </div>
            <div>
              <label className={labelClass}>Monthly Purchases</label>
              <input type="number" min="0" value={form.monthly_purchases} onChange={e => set('monthly_purchases', e.target.value)} className={inputClass} placeholder="30000" />
            </div>
          </div>
          <div className="mt-3">
            <label className={labelClass}>Demand Note</label>
            <input value={form.demand_note} onChange={e => set('demand_note', e.target.value)} className={inputClass} placeholder="Manual demand insight" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={loading} className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
            <Save className="h-3.5 w-3.5" />
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="text-gray-800 text-xs font-medium text-right max-w-[65%] break-words">
        {value ?? <span className="text-gray-300 italic">Not set</span>}
      </span>
    </div>
  )
}
