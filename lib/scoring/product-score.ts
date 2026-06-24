import type { ScoreInput, ScoreBreakdown } from '@/types/supabase'

const APPROVED_CARRIERS = [
  'USPS', 'UPS', 'FedEx', 'DHL', 'OnTrac',
  'LaserShip', 'Amazon Logistics', 'DHL eCommerce',
]

function calcShippingSpeedScore(input: ScoreInput): { score: number; note: string } {
  const { handling_days_max, delivery_days_max } = input

  if (handling_days_max === null || delivery_days_max === null) {
    return { score: 0, note: 'Handling or delivery time not entered' }
  }
  if (handling_days_max <= 2 && delivery_days_max <= 6) {
    return { score: 20, note: `${handling_days_max}d handling + ${delivery_days_max}d delivery — excellent` }
  }
  if (handling_days_max <= 3 && delivery_days_max <= 8) {
    return { score: 10, note: `${handling_days_max}d handling + ${delivery_days_max}d delivery — acceptable` }
  }
  return { score: 0, note: `${handling_days_max}d handling + ${delivery_days_max}d delivery — too slow` }
}

function calcTrackingScore(input: ScoreInput): { score: number; note: string } {
  if (!input.tracking_supported) {
    return { score: 0, note: 'Tracking not supported' }
  }
  if (!input.tracking_carrier) {
    return { score: 0, note: 'Tracking carrier not specified' }
  }
  const carrierUpper = input.tracking_carrier.toUpperCase()
  const isApproved = APPROVED_CARRIERS.some(c => carrierUpper.includes(c.toUpperCase()))
  if (isApproved) {
    return { score: 15, note: `${input.tracking_carrier} — approved carrier` }
  }
  return { score: 0, note: `${input.tracking_carrier} — carrier not on approved list` }
}

function calcWarehouseScore(input: ScoreInput): { score: number; note: string } {
  if (!input.warehouse_country) {
    return { score: 0, note: 'Warehouse country unknown' }
  }
  if (input.warehouse_country.toUpperCase() === 'UNITED STATES' || input.warehouse_country.toUpperCase() === 'US') {
    return { score: 15, note: 'US warehouse — full points' }
  }
  if (input.verified_fast_shipping) {
    return { score: 8, note: 'Non-US warehouse but verified fast shipping' }
  }
  return { score: 0, note: `Warehouse in ${input.warehouse_country} — not US and not verified fast shipping` }
}

function calcMarginScore(input: ScoreInput): { score: number; note: string } {
  const { selling_price, landed_cost, shipping_cost } = input

  if (!selling_price || selling_price === 0) {
    return { score: 0, note: 'Selling price not entered' }
  }
  if (!landed_cost) {
    return { score: 0, note: 'Landed cost not entered' }
  }

  const profit = selling_price - landed_cost - (shipping_cost || 0)
  const margin = (profit / selling_price) * 100

  if (margin >= 55) {
    return { score: 15, note: `${margin.toFixed(1)}% margin — excellent` }
  }
  if (margin >= 40) {
    return { score: 10, note: `${margin.toFixed(1)}% margin — acceptable` }
  }
  return { score: 0, note: `${margin.toFixed(1)}% margin — below threshold (need 40%+)` }
}

function calcmarketplaceDemoScore(input: ScoreInput): { score: number; note: string } {
  const score = input.tiktok_demo_score_manual
  if (score === 15) {
    return { score: 15, note: 'Strong 3-second demo potential with visual use case' }
  }
  if (score === 10) {
    return { score: 10, note: 'Clear demo but no strong before/after moment' }
  }
  return { score: 0, note: 'Low marketplace demo potential or not assessed yet' }
}

function calcReturnRiskScore(input: ScoreInput): { score: number; note: string } {
  const highRisk = input.fragile || input.oversized || !input.return_supported
  const medRisk = input.battery || input.liquid || input.child_product

  if (highRisk) {
    return { score: 0, note: 'High return risk — fragile, oversized, or no return policy' }
  }
  if (medRisk) {
    return { score: 5, note: 'Moderate return risk — battery, liquid, or kids product' }
  }
  return { score: 10, note: 'Low return risk' }
}

function calcComplianceScore(input: ScoreInput): { score: number; note: string } {
  const hasRisk =
    input.restricted ||
    input.trademark_risk ||
    input.medical_claim_risk ||
    input.counterfeit_risk ||
    input.weapon_like

  if (hasRisk) {
    return { score: 0, note: 'Compliance risk flagged — manual review required before marketplace approval' }
  }
  return { score: 10, note: 'No compliance or IP risks flagged' }
}

function buildDisqualifiers(input: ScoreInput, _scores: Record<string, number>): string[] {
  const dq: string[] = []

  if (!input.tracking_supported) dq.push('No reliable tracking')
  if (!input.warehouse_country) dq.push('Unknown warehouse location')
  if (input.handling_days_max !== null && input.delivery_days_max !== null) {
    const total = input.handling_days_max + input.delivery_days_max
    if (total > 8) dq.push(`Total delivery time ${total} days — exceeds 8-day limit`)
  }
  if (input.trademark_risk) dq.push('Trademark / copyright risk')
  if (input.restricted) dq.push('Restricted product — compliance approval required')
  if (!input.supplier_id) dq.push('No supplier assigned')
  if (!input.landed_cost) dq.push('Landed cost not entered')
  if (!input.selling_price) dq.push('Selling price not entered')
  if (!input.return_supported) dq.push('No return policy confirmed')
  if (!input.supplier_url) dq.push('No supplier URL')
  if (!input.tracking_carrier) dq.push('No shipping carrier specified')
  if (input.medical_claim_risk) dq.push('Medical claim risk — not allowed on marketplace')
  if (input.weapon_like) dq.push('Weapon-like product — manual compliance required')
  if (input.counterfeit_risk) dq.push('Counterfeit risk flagged')

  return dq
}

function buildRecommendations(input: ScoreInput, scores: Record<string, number>): string[] {
  const recs: string[] = []

  if (scores.shipping_speed === 0) {
    recs.push('Switch to a supplier with handling ≤2 days and delivery ≤6 days to maximize score')
  }
  if (scores.tracking === 0) {
    recs.push('Confirm tracking is supported and specify an approved carrier (USPS, UPS, FedEx, DHL, OnTrac)')
  }
  if (scores.warehouse === 0) {
    recs.push('Source from a US-based warehouse or confirm verified fast shipping')
  }
  if (scores.margin === 0 && input.selling_price && input.landed_cost) {
    const needed = input.landed_cost / 0.6
    recs.push(`Increase selling price to at least $${needed.toFixed(2)} to reach 40% margin`)
  }
  if (scores.tiktok_demo === 0) {
    recs.push('Assess marketplace demo potential — admin must manually score this field')
  }
  if (scores.return_risk === 0) {
    recs.push('Add a return policy or confirm supplier accepts returns to reduce return risk')
  }

  return recs
}

export function scoreProduct(input: ScoreInput): ScoreBreakdown {
  const shippingResult = calcShippingSpeedScore(input)
  const trackingResult = calcTrackingScore(input)
  const warehouseResult = calcWarehouseScore(input)
  const marginResult = calcMarginScore(input)
  const tiktokResult = calcmarketplaceDemoScore(input)
  const returnResult = calcReturnRiskScore(input)
  const complianceResult = calcComplianceScore(input)

  const scores = {
    shipping_speed: shippingResult.score,
    tracking: trackingResult.score,
    warehouse: warehouseResult.score,
    margin: marginResult.score,
    tiktok_demo: tiktokResult.score,
    return_risk: returnResult.score,
    compliance: complianceResult.score,
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0)

  const disqualifiers = buildDisqualifiers(input, scores)

  const hasDisqualifier = disqualifiers.length > 0
  const approved_for_tiktok =
    !hasDisqualifier &&
    total >= 85 &&
    !!input.supplier_id &&
    (input.warehouse_country?.toUpperCase() === 'UNITED STATES' ||
      input.warehouse_country?.toUpperCase() === 'US' ||
      input.verified_fast_shipping) &&
    input.handling_days_max !== null && input.handling_days_max <= 2 &&
    input.delivery_days_max !== null && input.delivery_days_max <= 6 &&
    input.return_supported &&
    !input.trademark_risk &&
    !input.restricted &&
    !input.medical_claim_risk

  const approved_to_scale = approved_for_tiktok && total >= 90

  const result: ScoreBreakdown = {
    total,
    ...scores,
    disqualifiers,
    recommendations: [],
    approved_for_tiktok,
    approved_to_scale,
  }

  result.recommendations = buildRecommendations(input, scores)

  return result
}

export function calcMarginPercent(
  sellingPrice: number,
  landedCost: number,
  shippingCost: number = 0
): number {
  if (sellingPrice === 0) return 0
  return ((sellingPrice - landedCost - shippingCost) / sellingPrice) * 100
}

export function calcEstimatedProfit(
  sellingPrice: number,
  landedCost: number,
  shippingCost: number = 0
): number {
  return sellingPrice - landedCost - shippingCost
}
