'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ProductStatus, ScoreBreakdown } from '@/types/supabase'
import { cn } from '@/lib/utils/cn'

interface Props {
  productId: string
  currentStatus: ProductStatus
  isAffiliate: boolean
  affiliateReady: boolean
  breakdown?: ScoreBreakdown
  hasComplianceBlocker?: boolean
}

export function ProductApprovalActions({
  productId,
  currentStatus,
  isAffiliate,
  affiliateReady,
  breakdown,
  hasComplianceBlocker,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function transition(newStatus: ProductStatus, updates: Record<string, unknown> = {}) {
    setLoading(true)
    setMsg('')

    const { data: { user } } = await supabase.auth.getUser()

    const productUpdates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...updates,
    }

    if (newStatus === 'Live' && isAffiliate) {
      productUpdates.published = true
    }

    await supabase.from('products').update(productUpdates).eq('id', productId)

    await supabase.from('product_approval_events').insert({
      product_id: productId,
      admin_id: user?.id ?? null,
      from_status: currentStatus,
      to_status: newStatus,
      reason: (updates.reason as string) ?? null,
    })

    await supabase.from('audit_logs').insert({
      admin_id: user?.id ?? null,
      action: 'product_status_change',
      entity_type: 'product',
      entity_id: productId,
      old_value: { status: currentStatus },
      new_value: { status: newStatus, ...updates },
    })

    setLoading(false)
    router.refresh()
    setMsg(`Status updated to: ${newStatus}`)
  }

  async function runScore() {
    if (!breakdown) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('product_scores').insert({
      product_id: productId,
      total_score: breakdown.total,
      shipping_speed_score: breakdown.shipping_speed,
      tracking_score: breakdown.tracking,
      warehouse_score: breakdown.warehouse,
      margin_score: breakdown.margin,
      tiktok_demo_score: breakdown.tiktok_demo,
      return_risk_score: breakdown.return_risk,
      compliance_score: breakdown.compliance,
      disqualifiers: breakdown.disqualifiers,
      recommendations: breakdown.recommendations,
      approved_for_shopify: breakdown.approved_for_shopify,
      approved_for_tiktok: breakdown.approved_for_tiktok,
      approved_to_scale: breakdown.approved_to_scale,
    })

    await supabase.from('products').update({
      score: breakdown.total,
      approved_for_shopify: breakdown.approved_for_shopify,
      approved_for_tiktok: breakdown.approved_for_tiktok,
      approved_to_scale: breakdown.approved_to_scale,
    }).eq('id', productId)

    await supabase.from('audit_logs').insert({
      admin_id: user?.id ?? null,
      action: 'product_scored',
      entity_type: 'product',
      entity_id: productId,
      new_value: { score: breakdown.total },
    })

    setLoading(false)
    router.refresh()
    setMsg(`Score saved: ${breakdown.total}/100`)
  }

  const btn = (label: string, onClick: () => void, variant: 'primary' | 'danger' | 'secondary' | 'success' = 'secondary', disabled = false) => (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
        variant === 'primary' && 'bg-gray-900 text-white hover:bg-gray-800',
        variant === 'success' && 'bg-green-700 text-white hover:bg-green-600',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'secondary' && 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
      )}
    >
      {label}
    </button>
  )

  if (isAffiliate) {
    return (
      <div className="flex flex-wrap gap-2">
        {msg && <span className="w-full text-xs text-green-600">{msg}</span>}
        {currentStatus !== 'Live' &&
          btn('Mark Live', () => transition('Live'), 'success', !affiliateReady)}
        {currentStatus === 'Live' &&
          btn('Pause Product', () => transition('Paused'), 'secondary')}
        {currentStatus !== 'Disabled' &&
          btn('Disable Product', () => transition('Disabled'), 'danger')}
        {!affiliateReady && currentStatus !== 'Live' && (
          <p className="w-full text-xs text-orange-600">Complete title, category, image, and affiliate URL before going live.</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {msg && <span className="w-full text-xs text-green-600">{msg}</span>}

      {btn('Score Product', runScore, 'primary')}

      {breakdown?.approved_for_shopify && !hasComplianceBlocker &&
        btn('Approve for Shopify', () => transition('Approved for Shopify', { approved_for_shopify: true }), 'success')}

      {breakdown?.approved_for_tiktok && !hasComplianceBlocker &&
        btn('Approve for review', () => transition('Approved for TikTok Shop', { approved_for_tiktok: true }), 'success')}

      {btn('Move to Supplier Review', () => transition('Supplier Review'), 'secondary')}
      {btn('Move to Shipping Review', () => transition('Shipping Review'), 'secondary')}
      {btn('Move to Compliance Review', () => transition('Compliance Review'), 'secondary')}
      {btn('Require Test Order', () => transition('Test Order Required'), 'secondary')}

      {currentStatus === 'Approved for TikTok Shop' &&
        btn('Go Live', () => transition('Live'), 'success')}

      {currentStatus === 'Live' &&
        btn('Start Scaling', () => transition('Scaling'), 'success')}

      {btn('Pause Product', () => transition('Paused'), 'secondary')}
      {btn('Disable Product', () => transition('Disabled'), 'danger')}
    </div>
  )
}
