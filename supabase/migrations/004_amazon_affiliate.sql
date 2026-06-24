-- ============================================================
-- ViralVault Commerce OS — Amazon Affiliate / ViralVault Tracking
-- ============================================================

-- ─────────────────────────────────────────────
-- ADD FIELDS TO PRODUCTS
-- ─────────────────────────────────────────────
alter table products
  add column if not exists product_type text not null default 'dropship',
  add column if not exists amazon_affiliate_url text,
  add column if not exists amazon_product_url text,
  add column if not exists amazon_tracking_id text,
  add column if not exists affiliate_network text,
  add column if not exists marketplace text,
  add column if not exists affiliate_click_count int not null default 0,
  add column if not exists last_affiliate_click_at timestamptz,
  add column if not exists cta_text text not null default 'Add to Cart',
  add column if not exists fulfillment_responsibility text not null default 'self',
  add column if not exists affiliate_disclosure_enabled boolean not null default false,
  add column if not exists verification_status text not null default 'Unverified',
  add column if not exists published boolean not null default false;

-- ─────────────────────────────────────────────
-- AMAZON SETTINGS
-- One row per project — upserted by the app
-- ─────────────────────────────────────────────
create table if not exists amazon_settings (
  id uuid primary key default uuid_generate_v4(),
  amazon_associate_id text,
  default_amazon_tracking_id text,
  amazon_storefront_url text,
  amazon_disclosure_text text not null default
    'Some links may be Amazon affiliate links. As an Amazon Associate, we may earn from qualifying purchases at no extra cost to you.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger amazon_settings_updated_at before update on amazon_settings
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────
-- AFFILIATE CLICKS
-- Raw IP is never stored — only a SHA-256 hash
-- ─────────────────────────────────────────────
create table if not exists affiliate_clicks (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete set null,
  affiliate_url text,
  marketplace text,
  affiliate_network text,
  tracking_id text,
  source_page text,
  source_section text,
  referrer text,
  user_agent text,
  ip_hash text,
  clicked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index affiliate_clicks_product_id_idx on affiliate_clicks(product_id);
create index affiliate_clicks_clicked_at_idx on affiliate_clicks(clicked_at);
create index affiliate_clicks_marketplace_idx on affiliate_clicks(marketplace);

-- ─────────────────────────────────────────────
-- AMAZON REPORTS IMPORTS
-- For manually pasting Amazon Associates report data
-- ─────────────────────────────────────────────
create table if not exists amazon_reports_imports (
  id uuid primary key default uuid_generate_v4(),
  report_date date not null,
  tracking_id text,
  clicks int not null default 0,
  ordered_items int not null default 0,
  shipped_items int not null default 0,
  revenue numeric(10,2) not null default 0,
  commission numeric(10,2) not null default 0,
  conversion_rate numeric(5,2),
  raw_notes text,
  created_at timestamptz not null default now()
);

create index amazon_reports_imports_date_idx on amazon_reports_imports(report_date);
create index amazon_reports_imports_tracking_idx on amazon_reports_imports(tracking_id);

-- ─────────────────────────────────────────────
-- RLS FOR NEW TABLES
-- ─────────────────────────────────────────────
alter table amazon_settings enable row level security;
alter table affiliate_clicks enable row level security;
alter table amazon_reports_imports enable row level security;

-- Amazon settings — only staff can read/write
create policy "Staff can view amazon settings"
  on amazon_settings for select
  using (is_authenticated_staff());

create policy "Admins can manage amazon settings"
  on amazon_settings for all
  using (is_admin_or_above());

-- Affiliate clicks — public insert (the tracking route runs without auth)
-- Staff can read all clicks
create policy "Staff can view affiliate clicks"
  on affiliate_clicks for select
  using (is_authenticated_staff());

create policy "Public can insert affiliate clicks"
  on affiliate_clicks for insert
  with check (true);

-- Amazon report imports — staff only
create policy "Staff can view amazon reports"
  on amazon_reports_imports for select
  using (is_authenticated_staff());

create policy "Admins can manage amazon reports"
  on amazon_reports_imports for all
  using (is_admin_or_above());

-- ─────────────────────────────────────────────
-- SEED: default amazon_settings row
-- ─────────────────────────────────────────────
insert into amazon_settings (amazon_disclosure_text)
values (
  'Some links may be Amazon affiliate links. As an Amazon Associate, we may earn from qualifying purchases at no extra cost to you.'
)
on conflict do nothing;
