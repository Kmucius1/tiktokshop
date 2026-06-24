'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  'Amazon Finds',
  'Outdoor & Seasonal',
  'Beach Bag Essentials',
  'Home & Kitchen',
  'Viral Drinkware',
  'Travel + Vacation Finds',
  'Under $25',
]

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    category: 'Amazon Finds',
    short_description: '',
    description: '',
    supplier_url: '',
    supplier_sku: '',
    selling_price: '',
    compare_at_price: '',
    landed_cost: '',
    shipping_cost: '0',
    hero_image_url: '',
    tags: '',
    oversized: false,
    fragile: false,
    battery: false,
    liquid: false,
    child_product: false,
    restricted: false,
    trademark_risk: false,
    medical_claim_risk: false,
  })

  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const slug = slugify(form.title)

    const payload = {
      title: form.title,
      slug,
      category: form.category,
      short_description: form.short_description || null,
      description: form.description || null,
      supplier_url: form.supplier_url || null,
      supplier_sku: form.supplier_sku || null,
      selling_price: form.selling_price ? parseFloat(form.selling_price) : null,
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      landed_cost: form.landed_cost ? parseFloat(form.landed_cost) : null,
      shipping_cost: parseFloat(form.shipping_cost) || 0,
      hero_image_url: form.hero_image_url || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : null,
      oversized: form.oversized,
      fragile: form.fragile,
      battery: form.battery,
      liquid: form.liquid,
      child_product: form.child_product,
      restricted: form.restricted,
      trademark_risk: form.trademark_risk,
      medical_claim_risk: form.medical_claim_risk,
      status: 'Researching',
      approval_status: 'Not Approved',
    }

    const { data, error: dbError } = await supabase
      .from('products')
      .insert(payload)
      .select('id')
      .single()

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
      return
    }

    router.push(`/admin/products/${data.id}`)
  }

  const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  const checkbox = (field: string, label: string) => (
    <label key={field} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
      <input
        type="checkbox"
        checked={!!form[field as keyof typeof form]}
        onChange={e => set(field, e.target.checked)}
        className="rounded"
      />
      {label}
    </label>
  )

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
        <p className="mt-1 text-sm text-gray-500">New product starts in Researching status — must pass scoring before approval.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Basic info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Basic Info</h2>
          <div>
            <label className={labelClass}>Product Title *</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)} className={inputClass} placeholder="E.g. Floating Waterproof Phone Pouch" />
          </div>
          <div>
            <label className={labelClass}>Category *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={inputClass}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Short Description</label>
            <input value={form.short_description} onChange={e => set('short_description', e.target.value)} className={inputClass} placeholder="One-line customer-facing description" />
          </div>
          <div>
            <label className={labelClass}>Full Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className={inputClass} placeholder="Full product description" />
          </div>
          <div>
            <label className={labelClass}>Hero Image URL</label>
            <input value={form.hero_image_url} onChange={e => set('hero_image_url', e.target.value)} className={inputClass} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass}>Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} className={inputClass} placeholder="pool, waterproof, summer" />
          </div>
        </div>

        {/* Supplier */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Supplier Info (Optional at Creation)</h2>
          <div>
            <label className={labelClass}>Supplier Product URL</label>
            <input value={form.supplier_url} onChange={e => set('supplier_url', e.target.value)} className={inputClass} placeholder="https://autods.com/..." />
          </div>
          <div>
            <label className={labelClass}>Supplier SKU</label>
            <input value={form.supplier_sku} onChange={e => set('supplier_sku', e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Selling Price ($)</label>
              <input type="number" step="0.01" min="0" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} className={inputClass} placeholder="24.99" />
            </div>
            <div>
              <label className={labelClass}>Compare At Price ($)</label>
              <input type="number" step="0.01" min="0" value={form.compare_at_price} onChange={e => set('compare_at_price', e.target.value)} className={inputClass} placeholder="39.99" />
            </div>
            <div>
              <label className={labelClass}>Landed Cost ($)</label>
              <input type="number" step="0.01" min="0" value={form.landed_cost} onChange={e => set('landed_cost', e.target.value)} className={inputClass} placeholder="6.50" />
            </div>
            <div>
              <label className={labelClass}>Shipping Cost ($)</label>
              <input type="number" step="0.01" min="0" value={form.shipping_cost} onChange={e => set('shipping_cost', e.target.value)} className={inputClass} placeholder="0.00" />
            </div>
          </div>
        </div>

        {/* Risk flags */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Risk Flags</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {checkbox('oversized', 'Oversized')}
            {checkbox('fragile', 'Fragile')}
            {checkbox('battery', 'Battery / Lithium')}
            {checkbox('liquid', 'Contains Liquid')}
            {checkbox('child_product', 'Children\'s Product')}
            {checkbox('restricted', 'Restricted Category')}
            {checkbox('trademark_risk', 'Trademark Risk')}
            {checkbox('medical_claim_risk', 'Medical Claim Risk')}
          </div>
          <p className="mt-3 text-xs text-gray-400">Any flag requires manual review before approval.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
          <a href="/admin/products" className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
