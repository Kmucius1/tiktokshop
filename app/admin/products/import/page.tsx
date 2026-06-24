'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import type { ColumnMap } from '@/lib/import/detect-columns'
import { detectColumns } from '@/lib/import/detect-columns'
import { parseFile } from '@/lib/import/parse-file'

const FIELD_LABELS: Record<keyof ColumnMap, string> = {
  title:             'Product Title *',
  description:       'Description',
  supplier_url:      'Supplier URL',
  supplier_name:     'Supplier Name',
  source_product_id: 'Product ID',
  cost_price:        'Cost Price',
  shipping_cost:     'Shipping Cost',
  selling_price:     'Selling Price',
  sku:               'SKU',
  inventory:         'Inventory / Qty',
  category:          'Category',
  image_url:         'Image URL',
  processing_time:   'Processing Time (days)',
  variants:          'Variants',
  weight:            'Weight',
}

type Step = 'upload' | 'map' | 'preview' | 'importing' | 'done'

interface ImportResult {
  imported: number
  updated: number
  skipped: number
  errors: { row: number; message: string }[]
  importedTitles: string[]
}

export default function ImportPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [fileName, setFileName] = useState('')
  const [columnMap, setColumnMap] = useState<ColumnMap>({})
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  async function handleFile(file: File) {
    setParseError('')
    const parsed = await parseFile(file)
    if (parsed.error) { setParseError(parsed.error); return }
    if (!parsed.rows.length) { setParseError('File has no data rows'); return }

    setFileName(file.name)
    setHeaders(parsed.headers)
    setRows(parsed.rows)
    setColumnMap(detectColumns(parsed.headers))
    setStep('map')
  }

  async function handleImport() {
    setImporting(true)
    setStep('importing')

    const res = await fetch('/api/admin/import-products', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows, columnMap, fileName }),
    })

    const data = await res.json() as ImportResult
    setResult(data)
    setStep('done')
    setImporting(false)
  }

  const previewRows = rows.slice(0, 5)

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Products</h1>
        <p className="mt-1 text-sm text-gray-500">Upload a CSV or XLSX export from AutoDS or any supplier</p>
      </div>

      {/* Steps */}
      <div className="mb-8 flex items-center gap-2 text-xs font-medium">
        {(['upload', 'map', 'preview', 'done'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 ${step === s ? 'bg-sky-600 text-white' : i < (['upload','map','preview','importing','done'] as const).indexOf(step) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {i < 3 && <ChevronRight className="h-3 w-3 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div>
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 transition hover:border-sky-400 hover:bg-sky-50"
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          >
            <Upload className="h-10 w-10 text-gray-300 mb-4" />
            <p className="text-lg font-semibold text-gray-700">Drop your file here</p>
            <p className="mt-1 text-sm text-gray-400">CSV or XLSX · AutoDS export · Any supplier format</p>
            <button className="mt-6 rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500">
              Browse File
            </button>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>

          {parseError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {parseError}
            </div>
          )}

          <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">How to export from AutoDS</p>
            <ol className="space-y-1.5 text-sm text-gray-600">
              <li>1. Open AutoDS → <strong>Products</strong></li>
              <li>2. Select products with the checkbox at the top</li>
              <li>3. Click <strong>Export</strong> → <strong>Export to CSV</strong> or <strong>Export to XLSX</strong></li>
              <li>4. Upload the downloaded file here</li>
            </ol>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'map' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{fileName}</p>
              <p className="text-sm text-gray-500">{rows.length} rows detected</p>
            </div>
            <button onClick={() => setStep('upload')} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <p className="mb-4 text-sm font-semibold text-gray-700">Map your file columns to our fields</p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(FIELD_LABELS) as (keyof ColumnMap)[]).map(field => (
                <div key={field}>
                  <label className="mb-1 block text-xs font-medium text-gray-500">{FIELD_LABELS[field]}</label>
                  <select
                    value={columnMap[field] ?? ''}
                    onChange={e => setColumnMap(prev => ({ ...prev, [field]: e.target.value || undefined }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">— Not in file —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button onClick={() => setStep('upload')} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Back
            </button>
            <button
              onClick={() => setStep('preview')}
              disabled={!columnMap.title}
              className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
            >
              Preview Import ({rows.length} products)
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <div>
          <p className="mb-4 text-sm text-gray-500">Preview of first 5 rows. Check the data looks correct before importing.</p>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {(['title', 'cost_price', 'selling_price', 'inventory', 'sku', 'category'] as (keyof ColumnMap)[]).map(f => (
                    <th key={f} className="px-4 py-3 text-left font-medium text-gray-500">{FIELD_LABELS[f].replace(' *', '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previewRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900 max-w-xs truncate">{columnMap.title ? row[columnMap.title] : '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{columnMap.cost_price ? row[columnMap.cost_price] : '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{columnMap.selling_price ? row[columnMap.selling_price] : '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{columnMap.inventory ? row[columnMap.inventory] : '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{columnMap.sku ? row[columnMap.sku] : '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{columnMap.category ? row[columnMap.category] : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 5 && <p className="mt-2 text-xs text-gray-400">+ {rows.length - 5} more rows not shown</p>}

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setStep('map')} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="rounded-lg bg-green-700 px-8 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
            >
              Import {rows.length} Products
            </button>
          </div>
        </div>
      )}

      {/* Importing */}
      {step === 'importing' && (
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
          <p className="text-lg font-semibold text-gray-700">Importing {rows.length} products…</p>
          <p className="mt-1 text-sm text-gray-400">Skipping duplicates · Saving images · This may take a moment</p>
        </div>
      )}

      {/* Done */}
      {step === 'done' && result && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <div className="mb-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900">Import Complete</h2>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Imported',  value: result.imported,       color: 'text-green-700' },
              { label: 'Updated',   value: result.updated,        color: 'text-sky-700' },
              { label: 'Skipped',   value: result.skipped,        color: 'text-gray-500' },
              { label: 'Errors',    value: result.errors.length,  color: 'text-red-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl bg-gray-50 p-4 text-center">
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {result.importedTitles.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Imported Products (first 10)</p>
              <ul className="space-y-1">
                {result.importedTitles.map((t, i) => (
                  <li key={i} className="text-sm text-gray-700">✓ {t}</li>
                ))}
              </ul>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700 mb-2">Import Errors</p>
              {result.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-xs text-red-600">Row {e.row}: {e.message}</p>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button onClick={() => { setStep('upload'); setResult(null) }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Import Another File
            </button>
            <button onClick={() => router.push('/admin/products')} className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-semibold text-white hover:bg-sky-500">
              Go to Products Dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
