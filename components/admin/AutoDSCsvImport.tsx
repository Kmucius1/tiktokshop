'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface ImportResult {
  imported: number
  updated: number
  skipped: number
  errors: number
  error_details?: string[]
  imported_titles?: string[]
  updated_titles?: string[]
}

export function AutoDSCsvImport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setResult(null)
    setError('')
  }

  async function upload() {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/admin/autods-csv', {
        method: 'POST',
        body: form,
      })
      const data = await res.json() as ImportResult & { error?: string }
      if (!res.ok) { setError(data.error ?? 'Import failed'); return }
      setResult(data)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-1 text-base font-semibold text-gray-900">AutoDS CSV Import</h2>
      <p className="mb-5 text-sm text-gray-500">
        Export your products from AutoDS → download the CSV → upload it here.
        Products are upserted — existing imports update without creating duplicates.
      </p>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-gray-600">CSV File</label>
        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-8 transition hover:border-pink-300 hover:bg-pink-50"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-6 w-6 text-gray-400" />
          <p className="text-sm text-gray-500">
            {file ? file.name : 'Click to choose AutoDS export CSV'}
          </p>
          {file && (
            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFileChange}
          className="hidden"
        />
      </div>

      <button
        onClick={upload}
        disabled={!file || loading}
        className="flex items-center gap-2 rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-pink-500 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {loading ? 'Importing…' : 'Import Products'}
      </button>

      {error && (
        <div className="mt-4 flex gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-sm font-semibold text-green-800">Import complete</p>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { label: 'New', value: result.imported, color: 'text-green-700' },
              { label: 'Updated', value: result.updated, color: 'text-blue-700' },
              { label: 'Skipped', value: result.skipped, color: 'text-gray-500' },
              { label: 'Errors', value: result.errors, color: result.errors > 0 ? 'text-red-600' : 'text-gray-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-white border border-gray-100 py-3">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          {result.imported_titles && result.imported_titles.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-600 mb-1">Newly imported:</p>
              <ul className="space-y-0.5">
                {result.imported_titles.map((t, i) => (
                  <li key={i} className="text-xs text-gray-700">• {t}</li>
                ))}
                {result.imported > (result.imported_titles?.length ?? 0) && (
                  <li className="text-xs text-gray-400">…and {result.imported - (result.imported_titles?.length ?? 0)} more</li>
                )}
              </ul>
            </div>
          )}
          {result.error_details && result.error_details.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-red-600 mb-1">Errors:</p>
              <ul className="space-y-0.5">
                {result.error_details.map((e, i) => (
                  <li key={i} className="text-xs text-red-600">• {e}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 text-xs text-gray-400">
            New products are added with status "Researching" and not published. Review them in the Products tab.
          </p>
        </div>
      )}

      <div className="mt-5 rounded-lg bg-gray-50 border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">How to export from AutoDS</p>
        <ol className="space-y-1 text-xs text-gray-500 list-decimal list-inside">
          <li>Log in to AutoDS → go to My Products</li>
          <li>Select the products you want to import</li>
          <li>Click Export → Download CSV</li>
          <li>Upload that file here</li>
        </ol>
        <p className="mt-2 text-xs text-gray-400">
          Supported columns: Product Title, Cost/Price, Sell Price, Images, Description, Category, Source URL, Tags, Shipping Time.
          Column names are matched automatically — extra columns are ignored.
        </p>
      </div>
    </div>
  )
}
