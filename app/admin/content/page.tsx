export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/dates'
import Link from 'next/link'

const statusBadge = (s: string) => {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    ready: 'bg-green-100 text-green-700',
    published: 'bg-blue-100 text-blue-700',
    archived: 'bg-slate-100 text-slate-500',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[s] ?? 'bg-gray-100'}`}>
      {s}
    </span>
  )
}

export default async function ContentPage() {
  const supabase = await createClient()

  const { data: angles } = await supabase
    .from('content_angles')
    .select('*, products(title, slug, category)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">TikTok Content Angles</h1>
        <p className="mt-1 text-sm text-gray-500">{angles?.length ?? 0} content angles across all products</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(angles ?? []).map(angle => {
          const product = angle.products as { title: string; slug: string; category: string } | null
          return (
            <div key={angle.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  {product && (
                    <Link href={`/admin/products/${(angle as { product_id: string }).product_id}`} className="text-xs text-sky-600 hover:underline">
                      {product.title}
                    </Link>
                  )}
                </div>
                {statusBadge(angle.status)}
              </div>

              {angle.hook && (
                <p className="mb-2 text-base font-semibold text-gray-900 leading-snug">
                  "{angle.hook}"
                </p>
              )}

              {angle.video_concept && (
                <p className="mb-3 text-sm text-gray-600">{angle.video_concept}</p>
              )}

              {angle.demo_steps && angle.demo_steps.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-xs font-medium text-gray-500">Demo Steps</p>
                  <ol className="space-y-0.5">
                    {angle.demo_steps.map((step: string, i: number) => (
                      <li key={i} className="text-xs text-gray-600">{i + 1}. {step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {angle.caption && (
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 italic">
                  {angle.caption}
                </div>
              )}

              {angle.hashtags && angle.hashtags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {angle.hashtags.map((tag: string) => (
                    <span key={tag} className="text-xs text-sky-600">{tag}</span>
                  ))}
                </div>
              )}

              <p className="mt-3 text-xs text-gray-400">{formatDate(angle.created_at)}</p>
            </div>
          )
        })}

        {(angles ?? []).length === 0 && (
          <div className="col-span-2 py-12 text-center text-sm text-gray-400">
            No content angles yet. Add them from the product detail page.
          </div>
        )}
      </div>
    </div>
  )
}
