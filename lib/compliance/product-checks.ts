import type { Product } from '@/types/supabase'

export interface ComplianceFlag {
  field: string
  label: string
  message: string
  severity: 'warning' | 'blocker'
}

export function getComplianceFlags(product: Product): ComplianceFlag[] {
  const flags: ComplianceFlag[] = []

  if (product.trademark_risk) {
    flags.push({
      field: 'trademark_risk',
      label: 'Trademark Risk',
      message: 'Product may infringe on an existing trademark or brand. Cannot be approved for marketplace without manual review.',
      severity: 'blocker',
    })
  }

  if (product.restricted) {
    flags.push({
      field: 'restricted',
      label: 'Restricted Product',
      message: 'This product category may be restricted on marketplace or Shopify. Compliance approval required.',
      severity: 'blocker',
    })
  }

  if (product.medical_claim_risk) {
    flags.push({
      field: 'medical_claim_risk',
      label: 'Medical Claim Risk',
      message: 'Product description may contain medical claims. These are not allowed on marketplace.',
      severity: 'blocker',
    })
  }

  if (product.weapon_like) {
    flags.push({
      field: 'weapon_like',
      label: 'Weapon-Like Product',
      message: 'Product appears weapon-like (e.g., realistic water blaster). Manual compliance review required.',
      severity: 'blocker',
    })
  }

  if (product.counterfeit_risk) {
    flags.push({
      field: 'counterfeit_risk',
      label: 'Counterfeit Risk',
      message: 'Product may be a counterfeit or unauthorized replica. Review with supplier before listing.',
      severity: 'blocker',
    })
  }

  if (product.battery) {
    flags.push({
      field: 'battery',
      label: 'Battery / Lithium',
      message: 'Product contains a battery. Confirm battery shipping compliance with carrier before approval.',
      severity: 'warning',
    })
  }

  if (product.child_product) {
    flags.push({
      field: 'child_product',
      label: 'Children\'s Product',
      message: 'Product is intended for children. Must include compliance notes (ASTM, CPSC) before marketplace approval.',
      severity: 'warning',
    })
  }

  if (product.liquid) {
    flags.push({
      field: 'liquid',
      label: 'Liquid Product',
      message: 'Product contains liquid. Confirm leak-proof packaging and carrier restrictions.',
      severity: 'warning',
    })
  }

  if (product.oversized) {
    flags.push({
      field: 'oversized',
      label: 'Oversized Item',
      message: 'Product is oversized. Confirm shipping surcharges and carrier acceptance.',
      severity: 'warning',
    })
  }

  if (product.fragile) {
    flags.push({
      field: 'fragile',
      label: 'Fragile Item',
      message: 'Product is fragile. Confirm packaging standards to prevent damage claims.',
      severity: 'warning',
    })
  }

  return flags
}

export function hasBlockerFlags(product: Product): boolean {
  return getComplianceFlags(product).some(f => f.severity === 'blocker')
}

export function hasmarketplaceShippingBlock(product: Product): boolean {
  if (!product.tracking_supported) return true
  if (!product.warehouse_country) return true
  const country = product.warehouse_country.toUpperCase()
  const isUS = country === 'UNITED STATES' || country === 'US'
  if (!isUS && !product.verified_fast_shipping) return true
  if ((product.handling_days_max ?? 99) > 2) return true
  if ((product.delivery_days_max ?? 99) > 6) return true
  return false
}
