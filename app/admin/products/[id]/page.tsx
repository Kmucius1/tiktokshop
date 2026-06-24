export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductStatusBadge } from '@/components/admin/ProductStatusBadge'
import { ScoreBadge } from '@/components/admin/ScoreBadge'
import { ProductScoreBreakdown } from '@/components/admin/ProductScoreBreakdown'
import { ApprovalChecklist } from '@/components/admin/ApprovalChecklist'
import { MarginCalculator } from '@/components/admin/MarginCalculator'
import { AdminNoteForm } from '@/components/admin/AdminNoteForm'
import { SyncLogTable } from '@/components/admin/SyncLogTable'
import { formatMoney, formatPercent } from '@/lib/utils/money'
import { formatDate, formatDateTime } from '@/lib/utils/dates'
import { scoreProduct } from '@/lib/scoring/product-score'
import { getComplianceFlags } from '@/lib/compliance/product-checks'
import { isAffiliateProduct, getAffiliateReadiness } from '@/lib/utils/product-type'
import type { ScoreInput } from '@/types/supabase'
import { AlertTriangle, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { ProductApprovalActions } from './ProductApprovalActions'
import { AffiliateContentEditor } from './AffiliateContentEditor'
import { TikTokProductPanel } from './TikTokProductPanel'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: product },
    { data: checklist },
    { data: notes },
    { data: approvalHistory },
    { data: tiktokLogs },
    { data: lastScore },
    { data: contentAngles },
  ] = await Promise.all([
    supabase.from('products').select('*, suppliers(*), tiktok_shop_url, tiktok_ready, viral_score, content_potential_score, tiktok_hooks, tiktok_captions, tiktok_benefit_bullets, video_script, tiktok_hashtags').eq('id', id).single(),
    supabase.from('product_checklists').select('*').eq('product_id', id).single(),
    supabase.from('admin_notes').select('*, profiles(full_name, email)').eq('entity_type', 'product').eq('entity_id', id).order('created_at', { ascending: false }),
    supabase.from('product_approval_events').select('*, profiles(full_name)').eq('product_id', id).order('created_at', { ascending: false }),
    supabase.from('tiktok_sync_logs').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(10),
    supabase.from('product_scores').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(1),
    supabase.from('content_angles').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(5),
  ])

  if (!product) notFound()

  const isAffiliate = isAffiliateProduct(product)
  const affiliateReadiness = isAffiliate ? getAffiliateReadiness(product) : null

  // Only run dropship scoring for non-affiliate products
  const scoreInput: ScoreInput | null = isAffiliate ? null : {
    handling_days_max: product.handling_days_max,
    delivery_days_max: product.delivery_days_max,
    tracking_supported: product.tracking_supported,
    tracking_carrier: product.tracking_carrier,
    warehouse_country: product.warehouse_country,
    verified_fast_shipping: product.verified_fast_shipping,
    selling_price: product.selling_price,
    landed_cost: product.landed_cost,
    shipping_cost: product.shipping_cost ?? 0,
    tiktok_demo_score_manual: lastScore?.[0]?.tiktok_demo_score ?? 0,
    fragile: product.fragile,
    oversized: product.oversized,
    battery: product.battery,
    liquid: product.liquid,
    child_product: product.child_product,
    restricted: product.restricted,
    trademark_risk: product.trademark_risk,
    medical_claim_risk: product.medical_claim_risk,
    counterfeit_risk: product.counterfeit_risk,
    weapon_like: product.weapon_like,
    return_supported: product.return_supported,
    supplier_id: product.primary_supplier_id,
    supplier_url: product.supplier_url,
  }

  const breakdown = scoreInput ? scoreProduct(scoreInput) : undefined
  const complianceFlags = isAffiliate ? [] : getComplianceFlags(product)
  const hasBlockers = complianceFlags.some(f => f.severity === 'blocker')

  const section = (title: string, children: React.ReactNode) => (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>
      {children}
    </div>
  )

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between py-2 text-sm border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right max-w-[60%]">{value ?? '—'}</span>
    </div>
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isAffiliate && (
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">Amazon Affiliate</span>
            )}
            <ProductStatusBadge status={product.status} />
            {!isAffiliate && <ScoreBadge score={product.score} />}
            {!isAffiliate && product.approved_for_tiktok && (
              <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-700">TikTok Approved</span>
            )}
            {!isAffiliate && product.approved_to_scale && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Scale Ready</span>
            )}
          </div>
        </div>
        <ProductApprovalActions
          productId={product.id}
          currentStatus={product.status}
          isAffiliate={isAffiliate}
          affiliateReady={affiliateReadiness?.canGoLive ?? false}
          breakdown={breakdown}
          hasComplianceBlocker={hasBlockers}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Product Info */}
          {section('Product Info', (
            <div>
              {product.hero_image_url && (
                <img src={product.hero_image_url} alt={product.title} className="mb-4 h-48 w-full rounded-lg object-cover" />
              )}
              {row('Category', product.category)}
              {row('Slug', <span className="font-mono text-xs">{product.slug}</span>)}
              {row('Short Description', product.short_description)}
              {row('Tags', product.tags?.join(', '))}
              {!isAffiliate && row('TikTok ID', product.tiktok_product_id ?? <span className="text-gray-400 text-xs">Not synced</span>)}
              {!isAffiliate && row('AutoDS ID', product.autods_product_id ?? <span className="text-gray-400 text-xs">Not imported</span>)}
              {row('Created', formatDateTime(product.created_at))}
              {row('Last Updated', formatDateTime(product.updated_at))}
            </div>
          ))}

          {/* Affiliate Info — affiliate products only */}
          {isAffiliate && section('Affiliate Info', (
            <div>
              {row('Affiliate URL', product.amazon_affiliate_url
                ? <a href={product.amazon_affiliate_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-600 hover:underline">Open <ExternalLink className="h-3 w-3" /></a>
                : <span className="text-red-500 text-xs">Missing — required for public display</span>)}
              {row('Product URL', product.amazon_product_url
                ? <a href={product.amazon_product_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-600 hover:underline">Open <ExternalLink className="h-3 w-3" /></a>
                : null)}
              {row('Public page', product.slug
                ? <a href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-600 hover:underline">/product/{product.slug} <ExternalLink className="h-3 w-3" /></a>
                : null)}
              {row('Go link', product.slug
                ? <a href={`/go/${product.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-600 hover:underline">/go/{product.slug} <ExternalLink className="h-3 w-3" /></a>
                : null)}
              {row('Affiliate Network', product.affiliate_network)}
              {row('Tracking ID', product.amazon_tracking_id)}
              {row('CTA Text', product.cta_text)}
              {row('Published', product.published
                ? <span className="text-green-600">Yes</span>
                : <span className="text-gray-400">No</span>)}
              {row('Total Clicks', product.affiliate_click_count)}
            </div>
          ))}

          {/* Content & Demand — affiliate products only */}
          {isAffiliate && (
            <AffiliateContentEditor
              productId={product.id}
              fields={{
                why_trending: product.why_trending,
                main_benefit: product.main_benefit,
                best_audience: product.best_audience,
                problem_solved: product.problem_solved,
                trust_notes: product.trust_notes,
                demand_note: product.demand_note,
                monthly_purchases: product.monthly_purchases,
                amazon_rating: product.amazon_rating,
                amazon_review_count: product.amazon_review_count,
              }}
            />
          )}

          {/* Supplier Info — dropship only */}
          {!isAffiliate && section('Supplier Info', (
            <div>
              {product.suppliers ? (
                <>
                  {row('Supplier Name', (product.suppliers as { name: string }).name)}
                  {row('Platform', (product.suppliers as { platform: string }).platform)}
                  {row('Approved', (product.suppliers as { approved: boolean }).approved
                    ? <span className="text-green-600">Yes</span>
                    : <span className="text-orange-600">Not approved</span>)}
                  {row('Risk Level', (product.suppliers as { risk_level: string }).risk_level)}
                  {row('Warehouse', `${(product.suppliers as { warehouse_country?: string }).warehouse_country ?? '—'}`)}
                </>
              ) : (
                <p className="text-sm text-red-600">No supplier assigned. Product cannot be approved without a supplier.</p>
              )}
              {row('Supplier URL', product.supplier_url
                ? <a href={product.supplier_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-600 hover:underline">View <ExternalLink className="h-3 w-3" /></a>
                : null)}
              {row('Supplier SKU', product.supplier_sku)}
            </div>
          ))}

          {/* Shipping Info — dropship only */}
          {!isAffiliate && section('Shipping Info', (
            <div>
              {row('Warehouse Country', product.warehouse_country)}
              {row('Warehouse State', product.warehouse_state)}
              {row('Verified Fast Shipping', product.verified_fast_shipping ? 'Yes' : 'No')}
              {row('Handling Time', product.handling_days_min !== null && product.handling_days_max !== null
                ? `${product.handling_days_min}–${product.handling_days_max} business days`
                : null)}
              {row('Delivery Time', product.delivery_days_min !== null && product.delivery_days_max !== null
                ? `${product.delivery_days_min}–${product.delivery_days_max} business days`
                : null)}
              {row('Estimated Total Delivery', product.estimated_delivery_min !== null && product.estimated_delivery_max !== null
                ? `${product.estimated_delivery_min}–${product.estimated_delivery_max} business days`
                : null)}
              {row('Tracking Supported', product.tracking_supported
                ? <span className="text-green-600">Yes</span>
                : <span className="text-red-600">No</span>)}
              {row('Tracking Carrier', product.tracking_carrier)}
              {row('Returns Supported', product.return_supported ? 'Yes' : 'No')}
              {row('Return Policy', product.return_policy_url
                ? <a href={product.return_policy_url} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">View policy</a>
                : null)}
            </div>
          ))}

          {/* Pricing / Margin — dropship only */}
          {!isAffiliate && (
            <MarginCalculator
              initialSellingPrice={product.selling_price ?? 0}
              initialLandedCost={product.landed_cost ?? 0}
              initialShippingCost={product.shipping_cost ?? 0}
            />
          )}

          {/* Compliance flags — dropship only */}
          {!isAffiliate && complianceFlags.length > 0 && section('Compliance Flags', (
            <div className="space-y-3">
              {complianceFlags.map(f => (
                <div key={f.field} className={`flex gap-3 rounded-lg p-3 ${f.severity === 'blocker' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${f.severity === 'blocker' ? 'text-red-600' : 'text-yellow-600'}`} />
                  <div>
                    <p className={`text-sm font-semibold ${f.severity === 'blocker' ? 'text-red-700' : 'text-yellow-700'}`}>{f.label}</p>
                    <p className={`text-xs mt-0.5 ${f.severity === 'blocker' ? 'text-red-600' : 'text-yellow-600'}`}>{f.message}</p>
                  </div>
                </div>
              ))}
              {product.compliance_notes && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-600">Compliance Notes</p>
                  <p className="mt-1 text-sm text-gray-700">{product.compliance_notes}</p>
                </div>
              )}
            </div>
          ))}

          {/* Test Order — dropship only */}
          {!isAffiliate && section('Test Order', (
            <div>
              {row('Status', <span className={product.test_order_status === 'Passed' ? 'text-green-600' : product.test_order_status === 'Failed' ? 'text-red-600' : 'text-gray-700'}>
                {product.test_order_status}
              </span>)}
              {row('Date', formatDate(product.test_order_date))}
              {row('Tracking Status', product.test_tracking_status)}
            </div>
          ))}

          {/* Approval timeline — all products */}
          {section('Approval Timeline', (
            (approvalHistory ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">No approval events yet.</p>
            ) : (
              <ol className="relative border-l border-gray-200 ml-2">
                {(approvalHistory ?? []).map(event => (
                  <li key={event.id} className="mb-4 ml-4">
                    <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-gray-300" />
                    <p className="text-sm font-medium text-gray-900">
                      {event.from_status ? `${event.from_status} → ` : ''}{event.to_status}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(event.created_at)}
                      {(event.profiles as { full_name?: string } | null)?.full_name ? ` · ${(event.profiles as { full_name: string }).full_name}` : ''}
                    </p>
                    {event.reason && <p className="mt-1 text-xs text-gray-600">{event.reason}</p>}
                  </li>
                ))}
              </ol>
            )
          ))}

          {/* Content angles — dropship/TikTok only */}
          {!isAffiliate && (contentAngles ?? []).length > 0 && section('TikTok Content Angles', (
            <div className="space-y-4">
              {(contentAngles ?? []).map(angle => (
                <div key={angle.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-800">"{angle.hook}"</p>
                  {angle.video_concept && <p className="mt-1 text-xs text-gray-600">{angle.video_concept}</p>}
                  {angle.caption && <p className="mt-2 text-xs text-gray-500 italic">{angle.caption}</p>}
                </div>
              ))}
            </div>
          ))}

          {/* TikTok Shop panel — all products */}
          <TikTokProductPanel
            productId={product.id}
            title={product.title}
            category={product.category}
            description={product.description}
            selling_price={product.selling_price}
            tags={product.tags}
            why_trending={product.why_trending}
            main_benefit={product.main_benefit}
            tiktok_shop_url={product.tiktok_shop_url}
            tiktok_ready={product.tiktok_ready}
            tiktok_hooks={product.tiktok_hooks}
            tiktok_captions={product.tiktok_captions}
            tiktok_benefit_bullets={product.tiktok_benefit_bullets}
            video_script={product.video_script}
            tiktok_hashtags={product.tiktok_hashtags}
            viral_score={product.viral_score}
            content_potential_score={product.content_potential_score}
          />

          {/* Sync logs — dropship only */}
          {!isAffiliate && <SyncLogTable logs={tiktokLogs ?? []} title="TikTok Sync Logs" />}

          {/* Admin notes — all products */}
          <AdminNoteForm
            entityType="product"
            entityId={product.id}
            notes={notes ?? []}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Affiliate Readiness — affiliate products */}
          {isAffiliate && affiliateReadiness && (
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <h3 className="text-sm font-semibold text-gray-700">Affiliate Readiness</h3>
                <span className={`text-xs font-medium ${affiliateReadiness.canGoLive ? 'text-green-600' : 'text-orange-600'}`}>
                  {affiliateReadiness.canGoLive ? 'Ready to go live' : 'Needs attention'}
                </span>
              </div>
              <ul className="divide-y divide-gray-50">
                {([
                  { ok: affiliateReadiness.titleOk, label: 'Title' },
                  { ok: affiliateReadiness.categoryOk, label: 'Category' },
                  { ok: affiliateReadiness.imageOk, label: 'Hero Image' },
                  { ok: affiliateReadiness.urlOk, label: 'Amazon Affiliate URL' },
                  { ok: affiliateReadiness.descriptionOk, label: 'Short Description' },
                  { ok: affiliateReadiness.salesAngleOk, label: 'Sales Hook' },
                ] as { ok: boolean; label: string }[]).map(({ ok, label }) => (
                  <li key={label} className="flex items-center gap-3 px-5 py-3">
                    {ok
                      ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                      : <XCircle className="h-4 w-4 shrink-0 text-red-400" />}
                    <span className={`text-sm ${ok ? 'text-gray-700' : 'text-red-500'}`}>{label}</span>
                    <span className="ml-auto text-xs text-gray-400">{ok ? 'Ready' : 'Missing'}</span>
                  </li>
                ))}
                <li className="flex items-center gap-3 px-5 py-3">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="ml-auto">
                    <ProductStatusBadge status={product.status} />
                  </span>
                </li>
              </ul>
            </div>
          )}

          {/* Score breakdown — dropship products */}
          {!isAffiliate && breakdown && <ProductScoreBreakdown breakdown={breakdown} />}

          {/* Approval checklist — dropship products */}
          {!isAffiliate && checklist && <ApprovalChecklist checklist={checklist} />}
        </div>
      </div>
    </div>
  )
}
