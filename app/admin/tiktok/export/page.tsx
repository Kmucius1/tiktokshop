'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Download, CheckSquare, Square } from 'lucide-react'

interface Product {
  id: string
  title: string
  hero_image_url: string | null
  selling_price: number | null
  listing_status: string | null
  category: string | null
  tiktok_listings: { tiktok_title: string | null; listing_status: string | null }[] | null
}

export default function TikTokExportPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [filter, setFilter] = useState<'ready' | 'all'>('ready')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      let query = supabase
        .from('products')
        .select('id, title, hero_image_url, selling_price, listing_status, category, tiktok_listings(tiktok_title, listing_status)')
        .order('created_at', { ascending: false })

      if (filter === 'ready') {
        query = query.in('listing_status', ['Draft Ready', 'Not Prepared', 'Exported'])
      }

      const { data } = await query.limit(200)
      setProducts((data as Product[]) ?? [])
      setLoading(false)
    }
    load()
  }, [filter])

  function toggleAll() {
    if (selected.size === products.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map(p => p.id)))
    }
  }

  async function handleExport(format: 'full' | 'accelerator') {
    if (!selected.size) return
    setExporting(true)

    const res = await fetch('/api/admin/tiktok-export', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ productIds: Array.from(selected), format }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(`Export failed: ${err.error ?? res.statusText}`)
      setExporting(false)
      return
    }

    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `tiktok-export-${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)

    setExporting(false)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TikTok Export</h1>
          <p className="mt-1 text-sm text-gray-500">Export products as XLSX for TikTok Seller Center bulk upload</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter(f => f === 'ready' ? 'all' : 'ready')}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {filter === 'ready' ? 'Show All' : 'Show Ready Only'}
          </button>
        </div>
      </div>

      {/* Export actions */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4">
        <span className="text-sm font-semibold text-sky-800">{selected.size} selected</span>
        <button
          onClick={() => handleExport('full')}
          disabled={!selected.size || exporting}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export Full XLSX'}
        </button>
        <button
          onClick={() => handleExport('accelerator')}
          disabled={!selected.size || exporting}
          className="flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-5 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Accelerator (5 fields)
        </button>
        <button onClick={toggleAll} className="ml-auto text-xs text-sky-600 hover:underline">
          {selected.size === products.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg font-semibold text-gray-600">No products ready to export</p>
          <p className="mt-1 text-sm text-gray-400">Import products first, then prepare TikTok listings</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-3 text-left w-10">
                  <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                    {selected.size === products.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Qty</th>
                <th className="px-4 py-3 text-left font-medium">Listing Status</th>
                <th className="px-4 py-3 text-left font-medium">TikTok Title</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(p => {
                const isSelected = selected.has(p.id)
                const listing = Array.isArray(p.tiktok_listings) ? p.tiktok_listings[0] : null
                return (
                  <tr
                    key={p.id}
                    className={`cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-sky-50' : ''}`}
                    onClick={() => setSelected(prev => {
                      const next = new Set(prev)
                      isSelected ? next.delete(p.id) : next.add(p.id)
                      return next
                    })}
                  >
                    <td className="px-4 py-3">
                      {isSelected ? <CheckSquare className="h-4 w-4 text-sky-600" /> : <Square className="h-4 w-4 text-gray-300" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {p.hero_image_url
                            ? <Image src={p.hero_image_url} alt={p.title} fill className="object-cover" sizes="40px" />
                            : <span className="flex h-full items-center justify-center text-gray-300 text-lg">📦</span>
                          }
                        </div>
                        <span className="font-medium text-gray-900 line-clamp-1">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">{p.selling_price ? `$${p.selling_price.toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">—</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.listing_status === 'Draft Ready'    ? 'bg-sky-100 text-sky-700' :
                        p.listing_status === 'Exported'       ? 'bg-violet-100 text-violet-700' :
                        p.listing_status === 'Listed'         ? 'bg-green-100 text-green-700' :
                        p.listing_status === 'Error'          ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.listing_status ?? 'Not Prepared'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                      {listing?.tiktok_title ?? <span className="italic">Not prepared</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">After you export</p>
        <ol className="space-y-1.5 text-sm text-gray-600">
          <li>1. Download the XLSX file above</li>
          <li>2. Go to TikTok Seller Center → <strong>Products</strong> → <strong>Add Products</strong></li>
          <li>3. Choose <strong>Bulk Upload</strong> → upload your XLSX file</li>
          <li>4. Fix any TikTok validation errors</li>
          <li>5. Publish or save as draft</li>
          <li>6. Come back here and update listing status to <strong>Listed</strong></li>
        </ol>
        <a href="/admin/tiktok/seller-center-guide" className="mt-3 inline-block text-sm text-sky-600 hover:underline">
          View full step-by-step guide →
        </a>
      </div>
    </div>
  )
}
