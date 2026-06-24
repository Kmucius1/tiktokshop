-- ============================================================
-- ViralVault Commerce OS — Initial Schema
-- Run in Supabase SQL Editor or via supabase db push
-- ============================================================

-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
create type user_role as enum ('owner', 'admin', 'operator', 'viewer');

create type product_status as enum (
  'Researching',
  'Supplier Review',
  'Shipping Review',
  'Compliance Review',
  'Test Order Required',
  'Approved for Shopify',
  'Approved for TikTok Shop',
  'Live',
  'Scaling',
  'Paused',
  'Disabled'
);

create type approval_status as enum (
  'Not Approved',
  'Pending Review',
  'Approved',
  'Rejected',
  'Waived'
);

create type test_order_status as enum (
  'Not Started',
  'Placed',
  'In Transit',
  'Delivered',
  'Passed',
  'Failed',
  'Waived'
);

create type supplier_platform as enum (
  'AutoDS',
  'CJ Dropshipping',
  'Zendrop',
  'Spocket',
  'AliExpress',
  'DSers',
  'Direct',
  'Other'
);

create type risk_level as enum ('low', 'medium', 'high');

create type sync_action as enum (
  'create_product',
  'update_product',
  'sync_inventory',
  'fetch_order',
  'update_fulfillment',
  'sync_tracking',
  'import_product',
  'fulfill_order'
);

create type sync_status as enum ('pending', 'success', 'error', 'skipped');

create type order_channel as enum ('shopify', 'tiktok', 'manual');

create type sla_risk as enum ('green', 'yellow', 'orange', 'red');

create type fulfillment_status as enum (
  'unfulfilled',
  'pending',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed',
  'returned'
);

create type return_status as enum ('requested', 'approved', 'received', 'refunded', 'rejected');

create type checklist_status as enum ('pending', 'passed', 'failed', 'waived');

create type research_priority as enum ('low', 'medium', 'high', 'urgent');

create type research_status as enum ('idea', 'in_review', 'added', 'rejected');

create type content_status as enum ('draft', 'ready', 'published', 'archived');

-- ─────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. SUPPLIERS
-- ─────────────────────────────────────────────
create table suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  platform supplier_platform not null default 'Other',
  supplier_url text,
  contact_email text,
  warehouse_country text,
  warehouse_state text,
  processing_time_min int,
  processing_time_max int,
  shipping_time_min int,
  shipping_time_max int,
  tracking_carriers text[],
  neutral_packaging_available boolean not null default false,
  return_supported boolean not null default false,
  return_policy_url text,
  supplier_rating numeric(3,1),
  last_verified_date date,
  approved boolean not null default false,
  risk_level risk_level not null default 'medium',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 3. PRODUCTS
-- ─────────────────────────────────────────────
create table products (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  category text not null,
  description text,
  short_description text,
  status product_status not null default 'Researching',
  approval_status approval_status not null default 'Not Approved',

  -- Platform IDs (populated after sync)
  shopify_product_id text,
  tiktok_product_id text,
  autods_product_id text,

  -- Supplier
  primary_supplier_id uuid references suppliers(id),
  supplier_url text,
  supplier_sku text,

  -- Warehouse + Shipping
  warehouse_country text,
  warehouse_state text,
  verified_fast_shipping boolean not null default false,
  handling_days_min int,
  handling_days_max int,
  delivery_days_min int,
  delivery_days_max int,
  estimated_delivery_min int generated always as (
    coalesce(handling_days_min, 0) + coalesce(delivery_days_min, 0)
  ) stored,
  estimated_delivery_max int generated always as (
    coalesce(handling_days_max, 0) + coalesce(delivery_days_max, 0)
  ) stored,
  tracking_supported boolean not null default false,
  tracking_carrier text,

  -- Returns
  return_supported boolean not null default false,
  return_policy_url text,

  -- Pricing
  landed_cost numeric(10,2),
  shipping_cost numeric(10,2) not null default 0,
  selling_price numeric(10,2),
  compare_at_price numeric(10,2),
  margin_percent numeric(5,2),

  -- Risk flags
  oversized boolean not null default false,
  fragile boolean not null default false,
  battery boolean not null default false,
  liquid boolean not null default false,
  child_product boolean not null default false,
  restricted boolean not null default false,
  trademark_risk boolean not null default false,
  medical_claim_risk boolean not null default false,
  weapon_like boolean not null default false,
  counterfeit_risk boolean not null default false,

  -- Compliance
  compliance_notes text,
  ip_notes text,

  -- Test order
  test_order_status test_order_status not null default 'Not Started',
  test_order_date date,
  test_tracking_status text,

  -- Approval flags
  score int not null default 0,
  approved_for_shopify boolean not null default false,
  approved_for_tiktok boolean not null default false,
  approved_to_scale boolean not null default false,

  -- Media
  hero_image_url text,
  gallery_urls text[],
  tags text[],

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_status_idx on products(status);
create index products_category_idx on products(category);
create index products_score_idx on products(score);
create index products_slug_idx on products(slug);

-- ─────────────────────────────────────────────
-- 4. PRODUCT SUPPLIER LINKS
-- ─────────────────────────────────────────────
create table product_supplier_links (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete cascade,
  supplier_product_url text,
  supplier_sku text,
  cost numeric(10,2),
  shipping_cost numeric(10,2) not null default 0,
  inventory_status text,
  last_inventory_check timestamptz,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, supplier_id)
);

-- ─────────────────────────────────────────────
-- 5. PRODUCT SCORES
-- ─────────────────────────────────────────────
create table product_scores (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  total_score int not null default 0,
  shipping_speed_score int not null default 0,
  tracking_score int not null default 0,
  warehouse_score int not null default 0,
  margin_score int not null default 0,
  tiktok_demo_score int not null default 0,
  return_risk_score int not null default 0,
  compliance_score int not null default 0,
  disqualifiers text[],
  recommendations text[],
  approved_for_shopify boolean not null default false,
  approved_for_tiktok boolean not null default false,
  approved_to_scale boolean not null default false,
  created_at timestamptz not null default now()
);

create index product_scores_product_id_idx on product_scores(product_id);

-- ─────────────────────────────────────────────
-- 6. PRODUCT APPROVAL EVENTS
-- ─────────────────────────────────────────────
create table product_approval_events (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  admin_id uuid references profiles(id),
  from_status product_status,
  to_status product_status not null,
  reason text,
  notes text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 7. PRODUCT RESEARCH QUEUE
-- ─────────────────────────────────────────────
create table product_research_queue (
  id uuid primary key default uuid_generate_v4(),
  product_idea text not null,
  category text,
  source text,
  source_url text,
  trend_reason text,
  target_price numeric(10,2),
  estimated_landed_cost numeric(10,2),
  estimated_margin numeric(5,2),
  tiktok_angle text,
  search_keywords text[],
  priority research_priority not null default 'medium',
  status research_status not null default 'idea',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 8. SHOPIFY SYNC LOGS
-- ─────────────────────────────────────────────
create table shopify_sync_logs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id),
  order_id uuid,
  action sync_action not null,
  status sync_status not null default 'pending',
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 9. TIKTOK SYNC LOGS
-- ─────────────────────────────────────────────
create table tiktok_sync_logs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id),
  order_id uuid,
  action sync_action not null,
  status sync_status not null default 'pending',
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 10. AUTODS SYNC LOGS
-- ─────────────────────────────────────────────
create table autods_sync_logs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id),
  order_id uuid,
  action sync_action not null,
  status sync_status not null default 'pending',
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 11. ORDERS
-- ─────────────────────────────────────────────
create table orders (
  id uuid primary key default uuid_generate_v4(),
  shopify_order_id text,
  tiktok_order_id text,
  customer_name text,
  customer_email text,
  customer_state text,
  channel order_channel not null default 'shopify',
  status text not null default 'open',
  payment_status text not null default 'pending',
  fulfillment_status fulfillment_status not null default 'unfulfilled',
  supplier_id uuid references suppliers(id),
  total_price numeric(10,2),
  landed_cost_total numeric(10,2),
  gross_margin numeric(10,2),
  order_time timestamptz not null default now(),
  required_ship_by_time timestamptz,
  tracking_uploaded boolean not null default false,
  tracking_number text,
  tracking_carrier text,
  tracking_status text,
  sla_risk_status sla_risk not null default 'green',
  exception_reason text,
  manual_action_needed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_sla_risk_idx on orders(sla_risk_status);
create index orders_fulfillment_status_idx on orders(fulfillment_status);

-- ─────────────────────────────────────────────
-- 12. ORDER ITEMS
-- ─────────────────────────────────────────────
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity int not null default 1,
  selling_price numeric(10,2),
  landed_cost numeric(10,2),
  supplier_id uuid references suppliers(id),
  fulfillment_status fulfillment_status not null default 'unfulfilled',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 13. ORDER FULFILLMENT EVENTS
-- ─────────────────────────────────────────────
create table order_fulfillment_events (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  event_type text not null,
  event_message text,
  carrier text,
  tracking_number text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 14. TRACKING EVENTS
-- ─────────────────────────────────────────────
create table tracking_events (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  tracking_number text not null,
  carrier text,
  status text,
  last_scan_location text,
  last_scan_time timestamptz,
  estimated_delivery date,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 15. RETURNS
-- ─────────────────────────────────────────────
create table returns (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  reason text,
  status return_status not null default 'requested',
  refund_amount numeric(10,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 16. CONTENT ANGLES
-- ─────────────────────────────────────────────
create table content_angles (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  hook text,
  video_concept text,
  demo_steps text[],
  target_customer text,
  trend_reason text,
  script text,
  caption text,
  hashtags text[],
  status content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 17. PRODUCT CHECKLISTS
-- ─────────────────────────────────────────────
create table product_checklists (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade unique,
  supplier_verified checklist_status not null default 'pending',
  shipping_verified checklist_status not null default 'pending',
  tracking_verified checklist_status not null default 'pending',
  returns_verified checklist_status not null default 'pending',
  compliance_checked checklist_status not null default 'pending',
  ip_checked checklist_status not null default 'pending',
  margin_checked checklist_status not null default 'pending',
  test_order_placed checklist_status not null default 'pending',
  test_order_passed checklist_status not null default 'pending',
  approved_for_shopify checklist_status not null default 'pending',
  approved_for_tiktok checklist_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 18. ADMIN NOTES
-- ─────────────────────────────────────────────
create table admin_notes (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id uuid not null,
  admin_id uuid references profiles(id),
  note text not null,
  created_at timestamptz not null default now()
);

create index admin_notes_entity_idx on admin_notes(entity_type, entity_id);

-- ─────────────────────────────────────────────
-- 19. AUDIT LOGS
-- ─────────────────────────────────────────────
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on audit_logs(entity_type, entity_id);
create index audit_logs_admin_idx on audit_logs(admin_id);

-- ─────────────────────────────────────────────
-- TRIGGERS — updated_at
-- ─────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at();

create trigger products_updated_at before update on products
  for each row execute procedure update_updated_at();

create trigger suppliers_updated_at before update on suppliers
  for each row execute procedure update_updated_at();

create trigger product_supplier_links_updated_at before update on product_supplier_links
  for each row execute procedure update_updated_at();

create trigger orders_updated_at before update on orders
  for each row execute procedure update_updated_at();

create trigger returns_updated_at before update on returns
  for each row execute procedure update_updated_at();

create trigger content_angles_updated_at before update on content_angles
  for each row execute procedure update_updated_at();

create trigger product_checklists_updated_at before update on product_checklists
  for each row execute procedure update_updated_at();

create trigger product_research_queue_updated_at before update on product_research_queue
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────
-- TRIGGER — auto-create profile on signup
-- ─────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'viewer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────────
-- TRIGGER — auto-create checklist on product insert
-- ─────────────────────────────────────────────
create or replace function create_product_checklist()
returns trigger as $$
begin
  insert into product_checklists (product_id) values (new.id);
  return new;
end;
$$ language plpgsql;

create trigger product_checklist_on_insert
  after insert on products
  for each row execute procedure create_product_checklist();

-- ─────────────────────────────────────────────
-- FUNCTION — calculate margin
-- ─────────────────────────────────────────────
create or replace function calculate_margin(
  selling_price numeric,
  landed_cost numeric,
  shipping_cost numeric default 0
) returns numeric as $$
begin
  if selling_price is null or selling_price = 0 then return 0; end if;
  if landed_cost is null then return 0; end if;
  return round(
    ((selling_price - landed_cost - coalesce(shipping_cost, 0)) / selling_price) * 100,
    2
  );
end;
$$ language plpgsql immutable;
