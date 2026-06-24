'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink } from 'lucide-react'

export default function AmazonSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)

  const [form, setForm] = useState({
    amazon_associate_id: '',
    default_amazon_tracking_id: '',
    amazon_storefront_url: '',
    amazon_disclosure_text:
      'Some links may be Amazon affiliate links. As an Amazon Associate, we may earn from qualifying purchases at no extra cost to you.',
  })

  useEffect(() => {
    supabase.from('amazon_settings').select('*').limit(1).single()
      .then(({ data }) => {
        if (data) {
          setSettingsId(data.id)
          setForm({
            amazon_associate_id: data.amazon_associate_id ?? '',
            default_amazon_tracking_id: data.default_amazon_tracking_id ?? '',
            amazon_storefront_url: data.amazon_storefront_url ?? '',
            amazon_disclosure_text: data.amazon_disclosure_text ?? '',
          })
        }
        setLoading(false)
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    const payload = {
      amazon_associate_id: form.amazon_associate_id || null,
      default_amazon_tracking_id: form.default_amazon_tracking_id || null,
      amazon_storefront_url: form.amazon_storefront_url || null,
      amazon_disclosure_text: form.amazon_disclosure_text,
      updated_at: new Date().toISOString(),
    }

    if (settingsId) {
      await supabase.from('amazon_settings').update(payload).eq('id', settingsId)
    } else {
      const { data } = await supabase.from('amazon_settings').insert(payload).select('id').single()
      if (data) setSettingsId(data.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Amazon Associates Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your Amazon Influencer / Associates account to ViralVault click tracking.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* How it works */}
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
          <h2 className="mb-3 text-sm font-semibold text-sky-800">How Amazon affiliate tracking works</h2>
          <ol className="space-y-2 text-sm text-sky-800">
            <li><span className="font-semibold">1.</span> Log in at <a href="https://affiliate-program.amazon.com/home" target="_blank" rel="noopener noreferrer" className="underline">affiliate-program.amazon.com</a> and find your Associate / Store ID.</li>
            <li><span className="font-semibold">2.</span> Go to <strong>Manage Your Tracking IDs</strong> and create one for this site (e.g. <code className="rounded bg-sky-100 px-1">viralvault-20</code>).</li>
            <li><span className="font-semibold">3.</span> On any Amazon product page, use <strong>SiteStripe → Get Link → Text</strong> to generate an affiliate link.</li>
            <li><span className="font-semibold">4.</span> Confirm the link contains <code className="rounded bg-sky-100 px-1">tag=yourtrackingid-20</code> before using it.</li>
            <li><span className="font-semibold">5.</span> Paste your Associate ID and Tracking ID below. Paste affiliate links into product records.</li>
          </ol>
          <div className="mt-3 flex gap-3">
            <a href="https://affiliate-program.amazon.com/home" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500">
              Amazon Associates <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Settings form */}
        <form onSubmit={handleSave} className="rounded-xl border border-slate-300 bg-white p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700">Account Details</h2>

          <div>
            <label className={labelClass}>Amazon Associate ID / Store ID</label>
            <input
              value={form.amazon_associate_id}
              onChange={e => setForm(f => ({ ...f, amazon_associate_id: e.target.value }))}
              className={inputClass}
              placeholder="yourname-20"
            />
            <p className="mt-1 text-xs text-slate-500">Your main Associates account ID. Found in Associates Central account settings.</p>
          </div>

          <div>
            <label className={labelClass}>Default Tracking ID for This Site</label>
            <input
              value={form.default_amazon_tracking_id}
              onChange={e => setForm(f => ({ ...f, default_amazon_tracking_id: e.target.value }))}
              className={inputClass}
              placeholder="viralvault-20"
            />
            <p className="mt-1 text-xs text-slate-500">
              Create a separate Tracking ID in Associates Central → Manage Your Tracking IDs.
              Used to separate ViralVault traffic in Amazon reports.
            </p>
          </div>

          <div>
            <label className={labelClass}>Amazon Influencer Storefront URL</label>
            <input
              type="url"
              value={form.amazon_storefront_url}
              onChange={e => setForm(f => ({ ...f, amazon_storefront_url: e.target.value }))}
              className={inputClass}
              placeholder="https://www.amazon.com/shop/yourname"
            />
            <p className="mt-1 text-xs text-slate-500">Your public Amazon Influencer storefront link (optional).</p>
          </div>

          <div>
            <label className={labelClass}>Affiliate Disclosure Text</label>
            <textarea
              value={form.amazon_disclosure_text}
              onChange={e => setForm(f => ({ ...f, amazon_disclosure_text: e.target.value }))}
              rows={3}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-500">Shown on pages with Amazon affiliate products. Required by Amazon Associates program rules.</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </form>

        {/* What ViralVault tracks vs Amazon */}
        <div className="rounded-xl border border-slate-300 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">What each system tracks</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-800 mb-2">ViralVault tracks</p>
              <ul className="space-y-1 text-gray-600 text-xs">
                <li>✓ Outbound clicks to Amazon</li>
                <li>✓ Which product was clicked</li>
                <li>✓ Which page / section</li>
                <li>✓ Time of click</li>
                <li>✓ Top clicked products</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-2">Amazon Associates tracks</p>
              <ul className="space-y-1 text-gray-600 text-xs">
                <li>✓ Orders placed</li>
                <li>✓ Items shipped</li>
                <li>✓ Conversion rate</li>
                <li>✓ Revenue</li>
                <li>✓ Commission earned</li>
              </ul>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            ViralVault cannot see Amazon purchases or commissions directly. Use your Tracking ID to match
            ViralVault clicks with Amazon report data.
          </p>
        </div>
      </div>
    </div>
  )
}
