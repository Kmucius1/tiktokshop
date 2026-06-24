-- ============================================================
-- Migration 007 — TikTok Shop + Viral Scoring Fields
-- ============================================================

-- ─────────────────────────────────────────────
-- TIKTOK SHOP + VIRAL FIELDS ON PRODUCTS
-- ─────────────────────────────────────────────
alter table products
  add column if not exists tiktok_shop_url        text,
  add column if not exists tiktok_ready           boolean not null default false,
  add column if not exists viral_score            int not null default 0,
  add column if not exists views_count            int,
  add column if not exists purchase_count         int,
  add column if not exists content_potential_score int not null default 0,
  add column if not exists tiktok_hooks           text[],
  add column if not exists tiktok_captions        text[],
  add column if not exists tiktok_benefit_bullets text[],
  add column if not exists video_script           text,
  add column if not exists tiktok_hashtags        text,
  add column if not exists autods_import_id       text;

-- Indexes for filtering/sorting by viral signals
create index if not exists products_viral_score_idx     on products(viral_score desc);
create index if not exists products_tiktok_ready_idx    on products(tiktok_ready);
create index if not exists products_views_count_idx     on products(views_count desc nulls last);
create index if not exists products_purchase_count_idx  on products(purchase_count desc nulls last);

-- Unique index on autods_import_id to prevent duplicate imports
create unique index if not exists products_autods_import_id_uniq
  on products(autods_import_id)
  where autods_import_id is not null;
