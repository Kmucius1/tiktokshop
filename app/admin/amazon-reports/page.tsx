'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatMoney, formatPercent } from '@/lib/utils/money'
import { formatDate } from '@/lib/utils/dates'
import type { AmazonReportImport } from '@/types/supabase'
import { ExternalLink } from 'lucide-react'

export default function AmazonReportsPage() {
  const supabase = createClient()
  const [reports, setReports] = useState<AmazonReportImport[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const emptyForm = {
    report_date: new Date().toISOString().split('T')[0],
    tracking_id: '',
    clicks: '',
    ordered_items: '',
    shipped_items: '',
    revenue: '',
    commission: '',
    conversion_rate: '',
    raw_notes: '',
  }
  const [form, setForm] = useState(emptyForm)

  async function loadReports() {
    const { data } = await supabase
      .from('amazon_reports_imports')
      .select('*')
      .order('report_date', { ascending: false })
    setReports(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadReports() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('amazon_reports_imports').insert({
      report_date: form.report_date,
      tracking_id: form.tracking_id || null,
      clicks: parseInt(form.clicks) || 0,
      ordered_items: parseInt(form.ordered_items) || 0,
      shipped_items: parseInt(form.shipped_items) || 0,
      revenue: parseFloat(form.revenue) || 0,
      commission: parseFloat(form.commission) || 0,
      conversion_rate: form.conversion_rate ? parseFloat(form.conversion_rate) : null,
      raw_notes: form.raw_notes || null,
    })
    setForm(emptyForm)
    setShowForm(false)
    setSaving(false)
    await loadReports()
  }

  const inputClass = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'
  const labelClass = 'mb-1 block text-xs font-medium text-gray-600'

  const totals = reports.reduce((acc, r) => ({
    clicks: acc.clicks + r.clicks,
    orders: acc.orders + r.ordered_items,
    revenue: acc.revenue + r.revenue,
    commission: acc.commission + r.commission,
  }), { clicks: 0, orders: 0, revenue: 0, commission: 0 })

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amazon Associates Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Manually import data from your Amazon Associates reports. ViralVault cannot see this data automatically.</p>
        </div>
        <div className="flex gap-3">
          <a href="https://affiliate-program.amazon.com/home" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Amazon Reports <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={() => setShowForm(f => !f)}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            + Add Report
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        <strong>Manual import only.</strong> Go to your Amazon Associates account → Reports, copy the numbers for a date range or Tracking ID, and paste them here. ViralVault stores these for your reference — Amazon&apos;s reports are always the authoritative source for commissions and purchases.
      </div>

      {/* Totals */}
      {reports.length > 0 && (
        <div className="mb-6 grid grid-cols-4 gap-4">
          {[
            { label: 'Total Clicks (Amazon)', value: totals.clicks.toLocaleString() },
            { label: 'Total Orders', value: totals.orders.toLocaleString() },
            { label: 'Total Revenue', value: formatMoney(totals.revenue) },
            { label: 'Total Commission', value: formatMoney(totals.commission) },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSave} className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Add Report Entry</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>Report Date *</label>
              <input type="date" required value={form.report_date} onChange={e => setForm(f => ({ ...f, report_date: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tracking ID</label>
              <input value={form.tracking_id} onChange={e => setForm(f => ({ ...f, tracking_id: e.target.value }))} className={inputClass} placeholder="viralvault-20" />
            </div>
            <div>
              <label className={labelClass}>Clicks (Amazon)</label>
              <input type="number" min="0" value={form.clicks} onChange={e => setForm(f => ({ ...f, clicks: e.target.value }))} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Ordered Items</label>
              <input type="number" min="0" value={form.ordered_items} onChange={e => setForm(f => ({ ...f, ordered_items: e.target.value }))} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Shipped Items</label>
              <input type="number" min="0" value={form.shipped_items} onChange={e => setForm(f => ({ ...f, shipped_items: e.target.value }))} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Revenue ($)</label>
              <input type="number" step="0.01" min="0" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Commission ($)</label>
              <input type="number" step="0.01" min="0" value={form.commission} onChange={e => setForm(f => ({ ...f, commission: e.target.value }))} className={inputClass} placeholder="0.00" />
            </div>
            <div>
              <label className={labelClass}>Conversion Rate (%)</label>
              <input type="number" step="0.01" min="0" value={form.conversion_rate} onChange={e => setForm(f => ({ ...f, conversion_rate: e.target.value }))} className={inputClass} placeholder="0.00" />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className={labelClass}>Notes</label>
              <input value={form.raw_notes} onChange={e => setForm(f => ({ ...f, raw_notes: e.target.value }))} className={inputClass} placeholder="e.g. Week of June 1-7, viralvault-20 tracking ID" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={saving} className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Report table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-5 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Tracking ID</th>
                <th className="px-4 py-3 text-right font-medium">Clicks</th>
                <th className="px-4 py-3 text-right font-medium">Orders</th>
                <th className="px-4 py-3 text-right font-medium">Shipped</th>
                <th className="px-4 py-3 text-right font-medium">Revenue</th>
                <th className="px-4 py-3 text-right font-medium">Commission</th>
                <th className="px-4 py-3 text-right font-medium">Conv. Rate</th>
                <th className="px-4 py-3 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{formatDate(r.report_date)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.tracking_id ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{r.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{r.ordered_items}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{r.shipped_items}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatMoney(r.revenue)}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-700">{formatMoney(r.commission)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{r.conversion_rate ? `${r.conversion_rate}%` : '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{r.raw_notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reports.length === 0 && !loading && (
          <div className="py-12 text-center text-sm text-gray-400">
            No reports yet. Click <strong>+ Add Report</strong> to manually enter Amazon Associates report data.
          </div>
        )}
      </div>
    </div>
  )
}
