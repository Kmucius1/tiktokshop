export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

interface WorkroomProduct {
  id: string
  title: string
  hero_image_url: string | null
  selling_price: number | null
  inventory: number | null
  status: string
  listing_status: string | null
  content_queue_status: string | null
  source_platform: string | null
}

function WorkroomCard({ product, nextAction, nextLabel, nextHref }: {
  product: WorkroomProduct
  nextAction: string
  nextLabel: string
  nextHref: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 hover:border-gray-200 transition">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {product.hero_image_url
          ? <Image src={product.hero_image_url} alt={product.title} fill className="object-cover" sizes="48px" />
          : <span className="flex h-full items-center justify-center text-gray-200 text-xl">📦</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{product.title}</p>
        <p className="text-xs text-gray-400">{product.source_platform ?? '—'} · {product.selling_price ? `$${product.selling_price.toFixed(2)}` : 'No price'}</p>
      </div>
      <Link
        href={nextHref}
        className="shrink-0 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 whitespace-nowrap"
      >
        {nextLabel} →
      </Link>
    </div>
  )
}

function Section({ title, count, children, emptyMsg, href }: {
  title: string
  count: number
  children: React.ReactNode
  emptyMsg: string
  href?: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          {count > 0 && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-700">{count}</span>
          )}
        </div>
        {href && count > 0 && (
          <Link href={href} className="text-xs text-sky-600 hover:underline">View all</Link>
        )}
      </div>
      <div className="p-3 space-y-2">
        {count === 0
          ? <p className="py-4 text-center text-sm text-gray-400">{emptyMsg}</p>
          : children
        }
      </div>
    </div>
  )
}

export default async function ProductWorkroomPage() {
  const supabase = await createClient()

  const [
    { data: newProducts },
    { data: needsReview },
    { data: readyForTikTok },
    { data: needsExport },
    { data: exportedNotListed },
    { data: needsContent },
    { data: contentReady },
    { data: errors },
  ] = await Promise.all([
    supabase.from('products').select('id,title,hero_image_url,selling_price,landed_cost,inventory,status,listing_status,content_queue_status,source_platform').eq('status', 'Researching').order('created_at', { ascending: false }).limit(10),
    supabase.from('products').select('id,title,hero_image_url,selling_price,landed_cost,inventory,status,listing_status,content_queue_status,source_platform').eq('status', 'Needs Review').order('created_at', { ascending: false }).limit(10),
    supabase.from('products').select('id,title,hero_image_url,selling_price,landed_cost,inventory,status,listing_status,content_queue_status,source_platform').eq('listing_status', 'Draft Ready').order('created_at', { ascending: false }).limit(10),
    supabase.from('products').select('id,title,hero_image_url,selling_price,landed_cost,inventory,status,listing_status,content_queue_status,source_platform').eq('listing_status', 'Not Prepared').not('status', 'eq', 'Researching').order('created_at', { ascending: false }).limit(10),
    supabase.from('products').select('id,title,hero_image_url,selling_price,landed_cost,inventory,status,listing_status,content_queue_status,source_platform').eq('listing_status', 'Exported').order('created_at', { ascending: false }).limit(10),
    supabase.from('products').select('id,title,hero_image_url,selling_price,landed_cost,inventory,status,listing_status,content_queue_status,source_platform').eq('content_queue_status', 'Needs Script').order('created_at', { ascending: false }).limit(10),
    supabase.from('products').select('id,title,hero_image_url,selling_price,landed_cost,inventory,status,listing_status,content_queue_status,source_platform').eq('content_queue_status', 'Script Ready').order('created_at', { ascending: false }).limit(10),
    supabase.from('products').select('id,title,hero_image_url,selling_price,landed_cost,inventory,status,listing_status,content_queue_status,source_platform').eq('listing_status', 'Error').order('created_at', { ascending: false }).limit(10),
  ])

  const p = (list: WorkroomProduct[] | null, next: string, label: string, href?: string) =>
    (list ?? []).map(product => (
      <WorkroomCard
        key={product.id}
        product={product}
        nextAction={next}
        nextLabel={label}
        nextHref={href ?? `/admin/products/${product.id}`}
      />
    ))

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Workroom</h1>
        <p className="mt-1 text-sm text-gray-500">Your daily product pipeline — clear each section to keep moving products to listed</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="1. New Imports — Needs Review" count={newProducts?.length ?? 0} emptyMsg="No new products" href="/admin/products?status=Researching">
          {p(newProducts as unknown as WorkroomProduct[], 'Review', 'Review Product')}
        </Section>

        <Section title="2. In Review" count={needsReview?.length ?? 0} emptyMsg="Nothing in review" href="/admin/products?status=Needs+Review">
          {p(needsReview as unknown as WorkroomProduct[], 'Continue', 'Continue Review')}
        </Section>

        <Section title="3. Ready — Needs TikTok Listing Prep" count={needsExport?.length ?? 0} emptyMsg="All listings prepared" href="/admin/products?listing=Not+Prepared">
          {p(needsExport as unknown as WorkroomProduct[], 'Prepare', 'Generate Listing')}
        </Section>

        <Section title="4. Listing Draft Ready — Export to TikTok" count={readyForTikTok?.length ?? 0} emptyMsg="Nothing ready to export" href="/admin/tiktok/export">
          {p(readyForTikTok as unknown as WorkroomProduct[], 'Export', 'Export to TikTok', '/admin/tiktok/export')}
        </Section>

        <Section title="5. Exported — Not Yet Listed" count={exportedNotListed?.length ?? 0} emptyMsg="All exports have been listed">
          {p(exportedNotListed as unknown as WorkroomProduct[], 'Mark Listed', 'Mark as Listed')}
        </Section>

        <Section title="6. Listed — Needs Content" count={needsContent?.length ?? 0} emptyMsg="No content needed" href="/admin/content-queue">
          {p(needsContent as unknown as WorkroomProduct[], 'Script', 'Create Script')}
        </Section>

        <Section title="7. Script Ready — Ready to Film" count={contentReady?.length ?? 0} emptyMsg="No scripts waiting to film" href="/admin/content-queue">
          {p(contentReady as unknown as WorkroomProduct[], 'Film', 'View Script', '/admin/content-queue')}
        </Section>

        <Section title="8. Errors — Needs Attention" count={errors?.length ?? 0} emptyMsg="No errors" href="/admin/products?listing=Error">
          {p(errors as unknown as WorkroomProduct[], 'Fix', 'Fix Error')}
        </Section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/products/import" className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500">
          + Import Products
        </Link>
        <Link href="/admin/tiktok/export" className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Export to TikTok
        </Link>
        <Link href="/admin/content-queue" className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Content Queue
        </Link>
      </div>
    </div>
  )
}
