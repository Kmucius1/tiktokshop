'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'

export default function TikTokShopSettingsPage() {
  const [saved, setSaved] = useState(false)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiktokshop.art'
  const callbackUrl = `${siteUrl}/api/tiktok/callback`

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">TikTok Shop API</h1>
        <p className="mt-1 text-sm text-gray-500">Connect your TikTok Seller Center for live product sync</p>
      </div>

      {/* Status */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Not connected</p>
            <p className="text-xs text-gray-400">TikTok API credentials not configured</p>
          </div>
        </div>
      </div>

      {/* Callback URL */}
      <div className="mb-6 rounded-xl border border-sky-100 bg-sky-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 mb-2">Your OAuth Callback URL</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-mono text-gray-800 select-all">
            {callbackUrl}
          </code>
          <button
            onClick={() => { navigator.clipboard.writeText(callbackUrl); setSaved(true); setTimeout(() => setSaved(false), 2000) }}
            className="shrink-0 rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50"
          >
            {saved ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 text-xs text-sky-700">Paste this in your TikTok developer app registration under "Redirect URI"</p>
      </div>

      {/* Setup steps */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <p className="text-sm font-bold text-gray-900">How to connect TikTok Shop API</p>

        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex gap-3">
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">1</span>
            <div>
              <p className="font-semibold text-gray-800">Go to TikTok Seller Center</p>
              <p className="text-xs mt-0.5">Apps &amp; Partners → App Store → "Develop your own app"</p>
              <a href="https://seller-us.tiktok.com/services/market" target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-sky-600 hover:underline">
                Open Seller Center <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">2</span>
            <div>
              <p className="font-semibold text-gray-800">Register a developer app</p>
              <p className="text-xs mt-0.5">Set the callback URL to the one shown above. Request product read/write scopes.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">3</span>
            <div>
              <p className="font-semibold text-gray-800">Add credentials to Vercel</p>
              <p className="text-xs mt-0.5">In your Vercel project settings → Environment Variables, add:</p>
              <ul className="mt-1 space-y-0.5 font-mono text-xs text-gray-500">
                <li>TIKTOK_SHOP_APP_KEY</li>
                <li>TIKTOK_SHOP_APP_SECRET</li>
                <li>TIKTOK_SHOP_ACCESS_TOKEN</li>
                <li>TIKTOK_SHOP_REFRESH_TOKEN</li>
              </ul>
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-sky-600 hover:underline">
                Open Vercel Dashboard <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">4</span>
            <div>
              <p className="font-semibold text-gray-800">Authorize the app</p>
              <p className="text-xs mt-0.5">Once App Key and Secret are set, authorize via TikTok's OAuth. Your access token will appear in the settings after redirect.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
          <p className="text-sm text-gray-500">
            <strong className="text-gray-700">Without API access:</strong> The full XLSX export workflow still works — export products here, upload to TikTok Seller Center manually. The API just makes it automatic.
          </p>
        </div>
      </div>
    </div>
  )
}
