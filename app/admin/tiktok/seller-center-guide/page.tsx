'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckSquare, Square, ExternalLink, Download } from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Export your products from this app', description: 'Go to TikTok Export, select your ready products, and download the XLSX file.', href: '/admin/tiktok/export', linkLabel: 'Go to Export →' },
  { id: 2, title: 'Open TikTok Seller Center', description: 'Sign in at seller-us.tiktok.com', href: 'https://seller-us.tiktok.com', linkLabel: 'Open Seller Center →', external: true },
  { id: 3, title: 'Go to Products', description: 'Click "Products" in the left sidebar of Seller Center.' },
  { id: 4, title: 'Click Add Products → Bulk Upload', description: 'Look for "Add Products" then choose "Bulk Upload" or "Import via Template".' },
  { id: 5, title: 'Upload your XLSX file', description: 'Select the file you downloaded in Step 1. TikTok will parse and validate the data.' },
  { id: 6, title: 'Fix any TikTok validation errors', description: 'TikTok may flag missing fields, wrong categories, or image issues. Fix them in the app, re-export, and re-upload.' },
  { id: 7, title: 'Publish or save as draft', description: 'Choose to publish immediately or save as draft to review before going live.' },
  { id: 8, title: 'Come back and mark products as Listed', description: 'Return to the product dashboard and update listing status to "Listed" for each product you published.', href: '/admin/products?listing=Exported', linkLabel: 'Update Products →' },
]

export default function SellerCenterGuidePage() {
  const [checked, setChecked] = useState<Set<number>>(new Set())

  function toggle(id: number) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allDone = checked.size === STEPS.length

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">TikTok Seller Center Upload Guide</h1>
        <p className="mt-1 text-sm text-gray-500">Follow these steps to get your products listed on TikTok Shop</p>
      </div>

      {/* Progress */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">{checked.size} of {STEPS.length} steps complete</span>
          {allDone && <span className="text-sm font-bold text-green-600">✅ All done!</span>}
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${(checked.size / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map(step => {
          const done = checked.has(step.id)
          return (
            <div
              key={step.id}
              className={`rounded-xl border p-5 transition ${done ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <div className="flex items-start gap-4">
                <button onClick={() => toggle(step.id)} className="mt-0.5 shrink-0">
                  {done
                    ? <CheckSquare className="h-5 w-5 text-green-600" />
                    : <Square className="h-5 w-5 text-gray-300" />
                  }
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">STEP {step.id}</span>
                  </div>
                  <p className={`text-sm font-semibold mt-0.5 ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {step.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                  {step.href && (
                    step.external ? (
                      <a
                        href={step.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm text-sky-600 hover:underline"
                      >
                        {step.linkLabel} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <Link href={step.href} className="mt-2 inline-flex items-center gap-1 text-sm text-sky-600 hover:underline">
                        {step.linkLabel}
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 rounded-xl border border-amber-100 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-800 mb-2">Common TikTok Upload Errors</p>
        <ul className="space-y-1 text-sm text-amber-700">
          <li>• <strong>Category not found</strong> → Use TikTok's exact category names from their template</li>
          <li>• <strong>Image rejected</strong> → Must be JPG/PNG, min 500×500px, no watermarks, no text overlays</li>
          <li>• <strong>Price too low</strong> → TikTok has minimum price thresholds per category</li>
          <li>• <strong>SKU duplicate</strong> → Each product needs a unique SKU across your shop</li>
          <li>• <strong>Missing required field</strong> → Use the Accelerator export (5 required fields only)</li>
        </ul>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/admin/tiktok/export" className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500">
          <Download className="h-4 w-4" /> Go to Export
        </Link>
        <Link href="/admin/product-workroom" className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Workroom
        </Link>
      </div>
    </div>
  )
}
