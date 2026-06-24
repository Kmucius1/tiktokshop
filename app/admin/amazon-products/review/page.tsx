export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatMoney } from '@/lib/utils/money'
import { formatDateTime } from '@/lib/utils/dates'
import { ExternalLink, CheckCircle2, XCircle, Plus } from 'lucide-react'
import { PublishToggle } from './PublishToggle'

export default async function AmazonProductsReviewPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, title, slug, category, selling_price, amazon_affiliate_url, amazon_tracking_id, affiliate_click_count, affiliate_disclosure_enabled, cta_text, verification_status, published, product_type, hero_image_url, created_at')
    .eq('product_type', 'amazon_affiliate')
    .order('created_at', { ascending: false })

  const published = (products ?? []).filter(p => p.published).length
  const drafts = (products ?? []).filter(p => !p.published).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amazon Products</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
            <span>{published} published</span>
            <span className="text-gray-300">·</span>
            <span>{drafts} drafts</span>
            <span className="text-gray-300">·</span>
            <span>{products?.length ?? 0} total</span>
          </div>
        </div>
        <Link
          href="/admin/amazon-products/new"
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Disclosure reminder */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Publish rule:</strong> Products are not visible publicly until you toggle Published to ON.
        Disclosure is auto-enabled on all Amazon affiliate products.
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-5 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Tracking ID</th>
                <th className="px-4 py-3 text-left font-medium">Affiliate Link</th>
                <th className="px-4 py-3 text-center font-medium">Disclosure</th>
                <th className="px-4 py-3 text-right font-medium">Clicks</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Published</th>
                <th className="px-4 py-3 text-left font-medium">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(products ?? []).map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 ${!p.published ? 'opacity-70' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {p.hero_image_url ? (
                        <img src={p.hero_image_url} alt="" className="h-10 w-10 rounded-lg object-cover bg-gray-100 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">🛒</div>
                      )}
                      <div>
                        <Link href={`/admin/products/${p.id}`} className="font-medium text-gray-900 hover:text-violet-600">
                          {p.title}
                        </Link>
                        <p className="text-xs text-gray-400">{p.category} · {formatMoney(p.selling_price)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {p.amazon_tracking_id ?? <span className="text-gray-300 not-italic">default</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.amazon_affiliate_url ? (
                      <a
                        href={p.amazon_affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-violet-600 hover:underline"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-red-500 font-medium">⚠ Missing</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.affiliate_disclosure_enabled
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      : <XCircle className="h-4 w-4 text-red-400 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${p.affiliate_click_count > 0 ? 'text-violet-700' : 'text-gray-400'}`}>
                      {p.affiliate_click_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.verification_status === 'Verified'
                        ? 'bg-green-100 text-green-700'
                        : p.verification_status === 'Source Found'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {p.verification_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PublishToggle productId={p.id} published={p.published} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {formatDateTime(p.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(products ?? []).length === 0 && (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🛒</p>
            <p className="text-sm font-medium text-gray-600">No Amazon products yet</p>
            <Link href="/admin/amazon-products/new" className="mt-3 inline-block text-sm text-violet-600 hover:underline">
              Add your first Amazon affiliate product →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
