'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AutoDSSettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [storeId, setStoreId] = useState('')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function testConnection() {
    if (!apiKey) return
    setTesting(true)
    setResult(null)

    // AutoDS API is not publicly available for third-party apps yet.
    // When it becomes available, this will test the connection.
    await new Promise(r => setTimeout(r, 1000))
    setResult({
      ok: false,
      message: 'AutoDS does not currently offer a public API for third-party apps. Use CSV/XLSX export as your import method.',
    })
    setTesting(false)
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AutoDS Connection</h1>
        <p className="mt-1 text-sm text-gray-500">Configure AutoDS API access when it becomes available</p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 p-5">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">AutoDS API Status</p>
            <p className="mt-1 text-sm text-amber-700">
              AutoDS does not currently offer a public REST API for third-party integrations.
              The active workflow is <strong>CSV/XLSX export</strong> from AutoDS → import here.
            </p>
            <a href="/admin/products/import" className="mt-2 inline-block text-sm text-amber-800 underline hover:text-amber-900">
              Go to CSV Import →
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest text-xs">API Settings (future use)</p>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">AutoDS API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Paste your AutoDS API key here"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <p className="mt-1 text-xs text-gray-400">This will be saved to your Vercel environment variables, not stored in the database.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">AutoDS Store ID</label>
          <input
            type="text"
            value={storeId}
            onChange={e => setStoreId(e.target.value)}
            placeholder="Your AutoDS store ID"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {result && (
          <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {result.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            {result.message}
          </div>
        )}

        <button
          onClick={testConnection}
          disabled={!apiKey || testing}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
      </div>

      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Current Import Workflow</p>
        <ol className="space-y-1.5 text-sm text-gray-600">
          <li>1. Open AutoDS → <strong>Products</strong></li>
          <li>2. Select all → <strong>Export</strong> → <strong>Export to CSV</strong></li>
          <li>3. Go to <a href="/admin/products/import" className="text-sky-600 hover:underline">Products → Import</a></li>
          <li>4. Upload the file → map columns → import</li>
        </ol>
      </div>
    </div>
  )
}
