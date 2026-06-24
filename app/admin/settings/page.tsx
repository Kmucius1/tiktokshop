import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">System configuration and API connection status</p>
      </div>

      <div className="mb-6 max-w-2xl">
        <Link href="/admin/settings/amazon"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 hover:bg-gray-50">
          <div>
            <p className="text-sm font-semibold text-gray-800">Amazon Associates Settings</p>
            <p className="text-xs text-gray-400 mt-0.5">Associate ID, Tracking ID, storefront URL, disclosure text</p>
          </div>
          <span className="text-sky-600 text-sm">Configure →</span>
        </Link>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Integration status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">API Connections</h2>
          <div className="space-y-3">
            {[
              {
                name: 'Supabase',
                env: 'NEXT_PUBLIC_SUPABASE_URL',
                status: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                note: 'Required for all system functionality',
              },
              {
                name: 'Shopify',
                env: 'SHOPIFY_STORE_DOMAIN',
                status: !!process.env.SHOPIFY_STORE_DOMAIN,
                note: 'Required for Shopify product and order sync',
              },
              {
                name: 'marketplace',
                env: 'TIKTOK_SHOP_APP_KEY',
                status: !!process.env.TIKTOK_SHOP_APP_KEY,
                note: 'Required for marketplace product sync and order tracking',
              },
              {
                name: 'AutoDS',
                env: 'AUTODS_API_KEY',
                status: !!process.env.AUTODS_API_KEY,
                note: 'Required for product import and auto-fulfillment',
              },
            ].map(item => (
              <div key={item.name} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.note}</p>
                  <p className="font-mono text-xs text-gray-300">{item.env}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {item.status ? 'Connected' : 'Not configured'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-2 text-sm font-semibold text-amber-800">Setup Instructions</h3>
          <ol className="space-y-1.5 text-sm text-amber-800">
            <li>1. Copy <code className="rounded bg-amber-100 px-1">.env.local.example</code> to <code className="rounded bg-amber-100 px-1">.env.local</code></li>
            <li>2. Add your Supabase project URL and anon key</li>
            <li>3. Run SQL migrations in your Supabase SQL editor</li>
            <li>4. Create your first admin user in Supabase Auth</li>
            <li>5. Set the user's role to 'owner' in the profiles table</li>
            <li>6. Connect Shopify, marketplace, and AutoDS when ready</li>
          </ol>
          <p className="mt-3 text-xs text-amber-700">See README.md for full setup instructions.</p>
        </div>

        {/* Scoring thresholds */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Approval Score Thresholds</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-50 py-2">
              <span className="text-gray-500">Shopify Approval Minimum</span>
              <span className="font-semibold text-indigo-700">75 / 100</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 py-2">
              <span className="text-gray-500">Marketplace Approval Minimum</span>
              <span className="font-semibold text-pink-700">85 / 100</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Scale Ready Minimum</span>
              <span className="font-semibold text-emerald-700">90 / 100</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">Thresholds are hardcoded in <code>lib/scoring/product-score.ts</code></p>
        </div>
      </div>
    </div>
  )
}
