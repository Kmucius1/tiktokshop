-- ============================================================
-- Migration 005 — Research Sources + Product Content Fields
-- ============================================================

-- ─────────────────────────────────────────────
-- RESEARCH SOURCES
-- For saving category pages, trend pages, competitor pages
-- as research inputs — not products
-- ─────────────────────────────────────────────
create table if not exists research_sources (
  id uuid primary key default uuid_generate_v4(),
  source_name text not null,
  source_type text not null,
  source_url text,
  marketplace text,
  notes text,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger research_sources_updated_at before update on research_sources
  for each row execute procedure update_updated_at();

alter table research_sources enable row level security;

create policy "Staff can view research sources"
  on research_sources for select
  using (is_authenticated_staff());

create policy "Operators can manage research sources"
  on research_sources for all
  using (is_operator_or_above());

-- ─────────────────────────────────────────────
-- PRODUCT CONTENT FIELDS
-- For Amazon affiliate page copy, SEO, Pinterest
-- ─────────────────────────────────────────────
alter table products
  add column if not exists product_summary text,
  add column if not exists why_trending text,
  add column if not exists best_for text,
  add column if not exists problem_solved text,
  add column if not exists trust_notes text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists pinterest_title text,
  add column if not exists pinterest_description text;
