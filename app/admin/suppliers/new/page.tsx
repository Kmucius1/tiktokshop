'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const PLATFORMS = ['AutoDS', 'CJ Dropshipping', 'Zendrop', 'Spocket', 'AliExpress', 'DSers', 'Direct', 'Other']
const CARRIERS = ['USPS', 'UPS', 'FedEx', 'DHL', 'OnTrac', 'LaserShip', 'Amazon Logistics', 'DHL eCommerce']

export default function NewSupplierPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    platform: 'AutoDS',
    supplier_url: '',
    contact_email: '',
    warehouse_country: '',
    warehouse_state: '',
    processing_time_min: '',
    processing_time_max: '',
    shipping_time_min: '',
    shipping_time_max: '',
    tracking_carriers: [] as string[],
    neutral_packaging_available: false,
    return_supported: false,
    return_policy_url: '',
    risk_level: 'medium',
    notes: '',
  })

  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }))

  function toggleCarrier(carrier: string) {
    setForm(f => ({
      ...f,
      tracking_carriers: f.tracking_carriers.includes(carrier)
        ? f.tracking_carriers.filter(c => c !== carrier)
        : [...f.tracking_carriers, carrier],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: dbError } = await supabase.from('suppliers').insert({
      name: form.name,
      platform: form.platform,
      supplier_url: form.supplier_url || null,
      contact_email: form.contact_email || null,
      warehouse_country: form.warehouse_country || null,
      warehouse_state: form.warehouse_state || null,
      processing_time_min: form.processing_time_min ? parseInt(form.processing_time_min) : null,
      processing_time_max: form.processing_time_max ? parseInt(form.processing_time_max) : null,
      shipping_time_min: form.shipping_time_min ? parseInt(form.shipping_time_min) : null,
      shipping_time_max: form.shipping_time_max ? parseInt(form.shipping_time_max) : null,
      tracking_carriers: form.tracking_carriers.length > 0 ? form.tracking_carriers : null,
      neutral_packaging_available: form.neutral_packaging_available,
      return_supported: form.return_supported,
      return_policy_url: form.return_policy_url || null,
      risk_level: form.risk_level,
      approved: false,
      notes: form.notes || null,
    })

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
      return
    }

    router.push('/admin/suppliers')
  }

  const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Supplier</h1>
        <p className="mt-1 text-sm text-gray-500">New suppliers start as not approved — review and approve before linking to TikTok products.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Supplier Info</h2>
          <div>
            <label className={labelClass}>Supplier Name *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Platform</label>
            <select value={form.platform} onChange={e => set('platform', e.target.value)} className={inputClass}>
              {PLATFORMS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Supplier URL</label>
            <input type="url" value={form.supplier_url} onChange={e => set('supplier_url', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contact Email</label>
            <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Warehouse Country</label>
              <input value={form.warehouse_country} onChange={e => set('warehouse_country', e.target.value)} className={inputClass} placeholder="United States" />
            </div>
            <div>
              <label className={labelClass}>Warehouse State</label>
              <input value={form.warehouse_state} onChange={e => set('warehouse_state', e.target.value)} className={inputClass} placeholder="CA" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Timing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Processing Min (days)</label>
              <input type="number" min="0" value={form.processing_time_min} onChange={e => set('processing_time_min', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Processing Max (days)</label>
              <input type="number" min="0" value={form.processing_time_max} onChange={e => set('processing_time_max', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Shipping Min (days)</label>
              <input type="number" min="0" value={form.shipping_time_min} onChange={e => set('shipping_time_min', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Shipping Max (days)</label>
              <input type="number" min="0" value={form.shipping_time_max} onChange={e => set('shipping_time_max', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Tracking Carriers</h2>
          <div className="flex flex-wrap gap-2">
            {CARRIERS.map(c => (
              <label key={c} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50">
                <input type="checkbox" checked={form.tracking_carriers.includes(c)} onChange={() => toggleCarrier(c)} className="rounded" />
                {c}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Returns & Risk</h2>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.return_supported} onChange={e => set('return_supported', e.target.checked)} className="rounded" />
            Returns supported
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.neutral_packaging_available} onChange={e => set('neutral_packaging_available', e.target.checked)} className="rounded" />
            Neutral packaging available
          </label>
          <div>
            <label className={labelClass}>Return Policy URL</label>
            <input type="url" value={form.return_policy_url} onChange={e => set('return_policy_url', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Risk Level</label>
            <select value={form.risk_level} onChange={e => set('risk_level', e.target.value)} className={inputClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className={inputClass} />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
            {loading ? 'Saving...' : 'Add Supplier'}
          </button>
          <a href="/admin/suppliers" className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
