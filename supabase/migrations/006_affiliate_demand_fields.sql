-- ============================================================
-- Migration 006 — Affiliate Demand & Social Proof Fields
-- ============================================================
-- Run in Supabase SQL Editor before deploying code that uses these fields.

alter table products
  add column if not exists main_benefit     text,
  add column if not exists best_audience    text,
  add column if not exists demand_note      text,
  add column if not exists monthly_purchases integer,
  add column if not exists amazon_rating    numeric(3, 1),
  add column if not exists amazon_review_count integer;

-- Indexes for sorting/filtering by demand signal
create index if not exists products_monthly_purchases_idx on products(monthly_purchases);
create index if not exists products_amazon_rating_idx     on products(amazon_rating);
