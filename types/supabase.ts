export type UserRole = 'owner' | 'admin' | 'operator' | 'viewer'

export type ProductStatus =
  | 'Researching'
  | 'Supplier Review'
  | 'Shipping Review'
  | 'Compliance Review'
  | 'Test Order Required'
  | 'Approved for TikTok Shop'
  | 'Live'
  | 'Scaling'
  | 'Paused'
  | 'Disabled'

export type ApprovalStatus = 'Not Approved' | 'Pending Review' | 'Approved' | 'Rejected' | 'Waived'

export type TestOrderStatus =
  | 'Not Started'
  | 'Placed'
  | 'In Transit'
  | 'Delivered'
  | 'Passed'
  | 'Failed'
  | 'Waived'

export type SupplierPlatform =
  | 'AutoDS'
  | 'CJ Dropshipping'
  | 'Zendrop'
  | 'Spocket'
  | 'AliExpress'
  | 'DSers'
  | 'Direct'
  | 'Other'

export type RiskLevel = 'low' | 'medium' | 'high'

export type SyncAction =
  | 'create_product'
  | 'update_product'
  | 'sync_inventory'
  | 'fetch_order'
  | 'update_fulfillment'
  | 'sync_tracking'
  | 'import_product'
  | 'fulfill_order'

export type SyncStatus = 'pending' | 'success' | 'error' | 'skipped'

export type OrderChannel = 'tiktok' | 'manual'

export type SlaRisk = 'green' | 'yellow' | 'orange' | 'red'

export type FulfillmentStatus =
  | 'unfulfilled'
  | 'pending'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned'

export type ReturnStatus = 'requested' | 'approved' | 'received' | 'refunded' | 'rejected'

export type ChecklistStatus = 'pending' | 'passed' | 'failed' | 'waived'

export type ResearchPriority = 'low' | 'medium' | 'high' | 'urgent'

export type ResearchStatus = 'idea' | 'in_review' | 'added' | 'rejected'

export type ContentStatus = 'draft' | 'ready' | 'published' | 'archived'

// ─── TABLE TYPES ─────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  platform: SupplierPlatform
  supplier_url: string | null
  contact_email: string | null
  warehouse_country: string | null
  warehouse_state: string | null
  processing_time_min: number | null
  processing_time_max: number | null
  shipping_time_min: number | null
  shipping_time_max: number | null
  tracking_carriers: string[] | null
  neutral_packaging_available: boolean
  return_supported: boolean
  return_policy_url: string | null
  supplier_rating: number | null
  last_verified_date: string | null
  approved: boolean
  risk_level: RiskLevel
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  title: string
  slug: string
  category: string
  description: string | null
  short_description: string | null
  status: ProductStatus
  approval_status: ApprovalStatus
  tiktok_product_id: string | null
  autods_product_id: string | null
  primary_supplier_id: string | null
  supplier_url: string | null
  supplier_sku: string | null
  warehouse_country: string | null
  warehouse_state: string | null
  verified_fast_shipping: boolean
  handling_days_min: number | null
  handling_days_max: number | null
  delivery_days_min: number | null
  delivery_days_max: number | null
  estimated_delivery_min: number | null
  estimated_delivery_max: number | null
  tracking_supported: boolean
  tracking_carrier: string | null
  return_supported: boolean
  return_policy_url: string | null
  landed_cost: number | null
  shipping_cost: number
  selling_price: number | null
  compare_at_price: number | null
  margin_percent: number | null
  oversized: boolean
  fragile: boolean
  battery: boolean
  liquid: boolean
  child_product: boolean
  restricted: boolean
  trademark_risk: boolean
  medical_claim_risk: boolean
  weapon_like: boolean
  counterfeit_risk: boolean
  compliance_notes: string | null
  ip_notes: string | null
  test_order_status: TestOrderStatus
  test_order_date: string | null
  test_tracking_status: string | null
  score: number
  approved_for_tiktok: boolean
  approved_to_scale: boolean
  hero_image_url: string | null
  gallery_urls: string[] | null
  tags: string[] | null
  // Amazon affiliate fields
  product_type: string
  amazon_affiliate_url: string | null
  amazon_product_url: string | null
  amazon_tracking_id: string | null
  affiliate_network: string | null
  marketplace: string | null
  affiliate_click_count: number
  last_affiliate_click_at: string | null
  cta_text: string
  fulfillment_responsibility: string
  affiliate_disclosure_enabled: boolean
  verification_status: string
  published: boolean
  // Content / SEO fields (migration 005)
  product_summary: string | null
  why_trending: string | null
  best_for: string | null
  problem_solved: string | null
  trust_notes: string | null
  seo_title: string | null
  seo_description: string | null
  pinterest_title: string | null
  pinterest_description: string | null
  // Demand / social proof fields (migration 006)
  main_benefit: string | null
  best_audience: string | null
  demand_note: string | null
  monthly_purchases: number | null
  amazon_rating: number | null
  amazon_review_count: number | null
  created_at: string
  updated_at: string
  // joined
  suppliers?: Supplier
}

export interface AmazonSettings {
  id: string
  amazon_associate_id: string | null
  default_amazon_tracking_id: string | null
  amazon_storefront_url: string | null
  amazon_disclosure_text: string
  created_at: string
  updated_at: string
}

export interface AffiliateClick {
  id: string
  product_id: string | null
  affiliate_url: string | null
  marketplace: string | null
  affiliate_network: string | null
  tracking_id: string | null
  source_page: string | null
  source_section: string | null
  referrer: string | null
  user_agent: string | null
  ip_hash: string | null
  clicked_at: string
  created_at: string
}

export interface AmazonReportImport {
  id: string
  report_date: string
  tracking_id: string | null
  clicks: number
  ordered_items: number
  shipped_items: number
  revenue: number
  commission: number
  conversion_rate: number | null
  raw_notes: string | null
  created_at: string
}

export interface ProductSupplierLink {
  id: string
  product_id: string
  supplier_id: string
  supplier_product_url: string | null
  supplier_sku: string | null
  cost: number | null
  shipping_cost: number
  inventory_status: string | null
  last_inventory_check: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface ProductScore {
  id: string
  product_id: string
  total_score: number
  shipping_speed_score: number
  tracking_score: number
  warehouse_score: number
  margin_score: number
  tiktok_demo_score: number
  return_risk_score: number
  compliance_score: number
  disqualifiers: string[] | null
  recommendations: string[] | null
  approved_for_tiktok: boolean
  approved_to_scale: boolean
  created_at: string
}

export interface ProductApprovalEvent {
  id: string
  product_id: string
  admin_id: string | null
  from_status: ProductStatus | null
  to_status: ProductStatus
  reason: string | null
  notes: string | null
  created_at: string
  profiles?: Profile
}

export interface ProductResearchQueue {
  id: string
  product_idea: string
  category: string | null
  source: string | null
  source_url: string | null
  trend_reason: string | null
  target_price: number | null
  estimated_landed_cost: number | null
  estimated_margin: number | null
  tiktok_angle: string | null
  search_keywords: string[] | null
  priority: ResearchPriority
  status: ResearchStatus
  created_at: string
  updated_at: string
}

export interface SyncLog {
  id: string
  product_id: string | null
  order_id: string | null
  action: SyncAction
  status: SyncStatus
  request_payload: Record<string, unknown> | null
  response_payload: Record<string, unknown> | null
  error_message: string | null
  created_at: string
}

export interface Order {
  id: string
  tiktok_order_id: string | null
  customer_name: string | null
  customer_email: string | null
  customer_state: string | null
  channel: OrderChannel
  status: string
  payment_status: string
  fulfillment_status: FulfillmentStatus
  supplier_id: string | null
  total_price: number | null
  landed_cost_total: number | null
  gross_margin: number | null
  order_time: string
  required_ship_by_time: string | null
  tracking_uploaded: boolean
  tracking_number: string | null
  tracking_carrier: string | null
  tracking_status: string | null
  sla_risk_status: SlaRisk
  exception_reason: string | null
  manual_action_needed: boolean
  created_at: string
  updated_at: string
  suppliers?: Supplier
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  quantity: number
  selling_price: number | null
  landed_cost: number | null
  supplier_id: string | null
  fulfillment_status: FulfillmentStatus
  created_at: string
  products?: Product
}

export interface OrderFulfillmentEvent {
  id: string
  order_id: string
  event_type: string
  event_message: string | null
  carrier: string | null
  tracking_number: string | null
  raw_payload: Record<string, unknown> | null
  created_at: string
}

export interface TrackingEvent {
  id: string
  order_id: string
  tracking_number: string
  carrier: string | null
  status: string | null
  last_scan_location: string | null
  last_scan_time: string | null
  estimated_delivery: string | null
  raw_payload: Record<string, unknown> | null
  created_at: string
}

export interface Return {
  id: string
  order_id: string
  product_id: string | null
  reason: string | null
  status: ReturnStatus
  refund_amount: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ContentAngle {
  id: string
  product_id: string
  hook: string | null
  video_concept: string | null
  demo_steps: string[] | null
  target_customer: string | null
  trend_reason: string | null
  script: string | null
  caption: string | null
  hashtags: string[] | null
  status: ContentStatus
  created_at: string
  updated_at: string
}

export interface ProductChecklist {
  id: string
  product_id: string
  supplier_verified: ChecklistStatus
  shipping_verified: ChecklistStatus
  tracking_verified: ChecklistStatus
  returns_verified: ChecklistStatus
  compliance_checked: ChecklistStatus
  ip_checked: ChecklistStatus
  margin_checked: ChecklistStatus
  test_order_placed: ChecklistStatus
  test_order_passed: ChecklistStatus
  approved_for_shopify: ChecklistStatus
  approved_for_tiktok: ChecklistStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AdminNote {
  id: string
  entity_type: string
  entity_id: string
  admin_id: string | null
  note: string
  created_at: string
  profiles?: Profile
}

export interface AuditLog {
  id: string
  admin_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  created_at: string
  profiles?: Profile
}

// ─── SCORING ─────────────────────────────────────────────────

export interface ScoreBreakdown {
  total: number
  shipping_speed: number
  tracking: number
  warehouse: number
  margin: number
  tiktok_demo: number
  return_risk: number
  compliance: number
  disqualifiers: string[]
  recommendations: string[]
  approved_for_tiktok: boolean
  approved_to_scale: boolean
}

export interface ScoreInput {
  handling_days_max: number | null
  delivery_days_max: number | null
  tracking_supported: boolean
  tracking_carrier: string | null
  warehouse_country: string | null
  verified_fast_shipping: boolean
  selling_price: number | null
  landed_cost: number | null
  shipping_cost: number
  tiktok_demo_score_manual: number // 0, 10, or 15 — set by admin
  fragile: boolean
  oversized: boolean
  battery: boolean
  liquid: boolean
  child_product: boolean
  restricted: boolean
  trademark_risk: boolean
  medical_claim_risk: boolean
  counterfeit_risk: boolean
  weapon_like: boolean
  return_supported: boolean
  supplier_id: string | null
  supplier_url: string | null
}

// ─── DASHBOARD STATS ─────────────────────────────────────────

export interface DashboardStats {
  total_products: number
  approved_for_tiktok: number
  live_products: number
  blocked_by_shipping: number
  blocked_by_compliance: number
  orders_sla_risk: number
  orders_missing_tracking: number
  sync_errors: number
}
