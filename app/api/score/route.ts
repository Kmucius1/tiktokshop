import { NextRequest, NextResponse } from 'next/server'
import { scoreProduct } from '@/lib/scoring/product-score'
import { createClient } from '@/lib/supabase/server'
import type { ScoreInput } from '@/types/supabase'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { productId: string; scoreInput: ScoreInput }
  const { productId, scoreInput } = body

  if (!productId || !scoreInput) {
    return NextResponse.json({ error: 'productId and scoreInput required' }, { status: 400 })
  }

  const breakdown = scoreProduct(scoreInput)

  // Save score to database
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

  // Update product score
  await supabase.from('products').update({
    score: breakdown.total,
    approved_for_shopify: breakdown.approved_for_shopify,
    approved_for_tiktok: breakdown.approved_for_tiktok,
    approved_to_scale: breakdown.approved_to_scale,
  }).eq('id', productId)

  await supabase.from('audit_logs').insert({
    admin_id: user.id,
    action: 'product_scored',
    entity_type: 'product',
    entity_id: productId,
    new_value: { score: breakdown.total },
  })

  return NextResponse.json({ breakdown })
}
