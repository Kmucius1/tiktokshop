-- ============================================================
-- ViralVault Commerce OS — Row Level Security Policies
-- ============================================================

-- ─────────────────────────────────────────────
-- ENABLE RLS ON ALL TABLES
-- ─────────────────────────────────────────────
alter table profiles enable row level security;
alter table products enable row level security;
alter table suppliers enable row level security;
alter table product_supplier_links enable row level security;
alter table product_scores enable row level security;
alter table product_approval_events enable row level security;
alter table product_research_queue enable row level security;
alter table shopify_sync_logs enable row level security;
alter table tiktok_sync_logs enable row level security;
alter table autods_sync_logs enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_fulfillment_events enable row level security;
alter table tracking_events enable row level security;
alter table returns enable row level security;
alter table content_angles enable row level security;
alter table product_checklists enable row level security;
alter table admin_notes enable row level security;
alter table audit_logs enable row level security;

-- ─────────────────────────────────────────────
-- HELPER FUNCTIONS
-- ─────────────────────────────────────────────
create or replace function get_my_role()
returns text as $$
  select role::text from profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function is_admin_or_above()
returns boolean as $$
  select get_my_role() in ('owner', 'admin');
$$ language sql security definer stable;

create or replace function is_operator_or_above()
returns boolean as $$
  select get_my_role() in ('owner', 'admin', 'operator');
$$ language sql security definer stable;

create or replace function is_authenticated_staff()
returns boolean as $$
  select get_my_role() in ('owner', 'admin', 'operator', 'viewer');
$$ language sql security definer stable;

-- ─────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────
create policy "Users can view their own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Staff can view all profiles"
  on profiles for select
  using (is_authenticated_staff());

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Admins can update any profile"
  on profiles for update
  using (is_admin_or_above());

-- ─────────────────────────────────────────────
-- PRODUCTS — public read for live approved products
-- ─────────────────────────────────────────────
create policy "Public can view live approved products"
  on products for select
  using (
    status = 'Live'
    and approved_for_shopify = true
  );

create policy "Staff can view all products"
  on products for select
  using (is_authenticated_staff());

create policy "Operators can insert products"
  on products for insert
  with check (is_operator_or_above());

create policy "Operators can update products"
  on products for update
  using (is_operator_or_above());

create policy "Admins can delete products"
  on products for delete
  using (is_admin_or_above());

-- ─────────────────────────────────────────────
-- SUPPLIERS
-- ─────────────────────────────────────────────
create policy "Staff can view suppliers"
  on suppliers for select
  using (is_authenticated_staff());

create policy "Operators can insert suppliers"
  on suppliers for insert
  with check (is_operator_or_above());

create policy "Operators can update suppliers"
  on suppliers for update
  using (is_operator_or_above());

create policy "Admins can delete suppliers"
  on suppliers for delete
  using (is_admin_or_above());

-- ─────────────────────────────────────────────
-- PRODUCT SUPPLIER LINKS
-- ─────────────────────────────────────────────
create policy "Staff can view product supplier links"
  on product_supplier_links for select
  using (is_authenticated_staff());

create policy "Operators can manage product supplier links"
  on product_supplier_links for all
  using (is_operator_or_above());

-- ─────────────────────────────────────────────
-- PRODUCT SCORES
-- ─────────────────────────────────────────────
create policy "Staff can view product scores"
  on product_scores for select
  using (is_authenticated_staff());

create policy "Operators can insert product scores"
  on product_scores for insert
  with check (is_operator_or_above());

-- ─────────────────────────────────────────────
-- PRODUCT APPROVAL EVENTS
-- ─────────────────────────────────────────────
create policy "Staff can view approval events"
  on product_approval_events for select
  using (is_authenticated_staff());

-- Only admin/owner can create approval events
create policy "Admins can insert approval events"
  on product_approval_events for insert
  with check (is_admin_or_above());

-- ─────────────────────────────────────────────
-- PRODUCT RESEARCH QUEUE
-- ─────────────────────────────────────────────
create policy "Staff can view research queue"
  on product_research_queue for select
  using (is_authenticated_staff());

create policy "Operators can manage research queue"
  on product_research_queue for all
  using (is_operator_or_above());

-- ─────────────────────────────────────────────
-- SYNC LOGS
-- ─────────────────────────────────────────────
create policy "Staff can view shopify sync logs"
  on shopify_sync_logs for select
  using (is_authenticated_staff());

create policy "Staff can view tiktok sync logs"
  on tiktok_sync_logs for select
  using (is_authenticated_staff());

create policy "Staff can view autods sync logs"
  on autods_sync_logs for select
  using (is_authenticated_staff());

create policy "Operators can insert shopify sync logs"
  on shopify_sync_logs for insert
  with check (is_operator_or_above());

create policy "Operators can insert tiktok sync logs"
  on tiktok_sync_logs for insert
  with check (is_operator_or_above());

create policy "Operators can insert autods sync logs"
  on autods_sync_logs for insert
  with check (is_operator_or_above());

-- ─────────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────────
create policy "Staff can view orders"
  on orders for select
  using (is_authenticated_staff());

create policy "Operators can manage orders"
  on orders for all
  using (is_operator_or_above());

create policy "Staff can view order items"
  on order_items for select
  using (is_authenticated_staff());

create policy "Operators can manage order items"
  on order_items for all
  using (is_operator_or_above());

create policy "Staff can view fulfillment events"
  on order_fulfillment_events for select
  using (is_authenticated_staff());

create policy "Operators can insert fulfillment events"
  on order_fulfillment_events for insert
  with check (is_operator_or_above());

create policy "Staff can view tracking events"
  on tracking_events for select
  using (is_authenticated_staff());

create policy "Operators can manage tracking events"
  on tracking_events for all
  using (is_operator_or_above());

-- ─────────────────────────────────────────────
-- RETURNS
-- ─────────────────────────────────────────────
create policy "Staff can view returns"
  on returns for select
  using (is_authenticated_staff());

create policy "Operators can manage returns"
  on returns for all
  using (is_operator_or_above());

-- ─────────────────────────────────────────────
-- CONTENT ANGLES
-- ─────────────────────────────────────────────
create policy "Staff can view content angles"
  on content_angles for select
  using (is_authenticated_staff());

create policy "Operators can manage content angles"
  on content_angles for all
  using (is_operator_or_above());

-- ─────────────────────────────────────────────
-- PRODUCT CHECKLISTS
-- ─────────────────────────────────────────────
create policy "Staff can view product checklists"
  on product_checklists for select
  using (is_authenticated_staff());

create policy "Operators can update product checklists"
  on product_checklists for update
  using (is_operator_or_above());

-- ─────────────────────────────────────────────
-- ADMIN NOTES
-- ─────────────────────────────────────────────
create policy "Staff can view admin notes"
  on admin_notes for select
  using (is_authenticated_staff());

create policy "Staff can insert admin notes"
  on admin_notes for insert
  with check (is_authenticated_staff());

-- ─────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────
create policy "Staff can view audit logs"
  on audit_logs for select
  using (is_authenticated_staff());

create policy "System can insert audit logs"
  on audit_logs for insert
  with check (is_operator_or_above());
