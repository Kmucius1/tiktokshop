-- Migration 008: Product Workroom
-- Adds tables and columns needed for the full AutoDS → TikTok Seller Center workflow

-- ── New enums ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM (
    'Not Prepared', 'Draft Ready', 'Exported', 'Uploaded', 'Listed', 'Rejected', 'Error'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE content_queue_status AS ENUM (
    'Not Started', 'Needs Script', 'Script Ready', 'Needs Video', 'Ready to Post', 'Posted', 'Archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE import_source AS ENUM (
    'autods_csv', 'autods_xlsx', 'autods_api', 'tiktok_api', 'manual'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Extend products table ─────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS source_platform       text,
  ADD COLUMN IF NOT EXISTS source_product_id     text,
  ADD COLUMN IF NOT EXISTS processing_time       integer,           -- days
  ADD COLUMN IF NOT EXISTS review_notes          text,
  ADD COLUMN IF NOT EXISTS tiktok_category       text,
  ADD COLUMN IF NOT EXISTS listing_status        listing_status DEFAULT 'Not Prepared',
  ADD COLUMN IF NOT EXISTS content_queue_status  content_queue_status DEFAULT 'Not Started',
  ADD COLUMN IF NOT EXISTS export_batch_id       uuid,
  ADD COLUMN IF NOT EXISTS imported_at           timestamptz;

-- Index for fast workroom queries
CREATE INDEX IF NOT EXISTS idx_products_listing_status  ON products(listing_status);
CREATE INDEX IF NOT EXISTS idx_products_content_status  ON products(content_queue_status);
CREATE INDEX IF NOT EXISTS idx_products_source_platform ON products(source_platform);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_source_product_id
  ON products(source_platform, source_product_id)
  WHERE source_product_id IS NOT NULL AND source_platform IS NOT NULL;

-- ── product_images ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url   text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  is_primary  boolean NOT NULL DEFAULT false,
  alt_text    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary    ON product_images(product_id, is_primary);

-- ── product_variants ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_variants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name  text NOT NULL,   -- e.g. "Color", "Size"
  variant_value text NOT NULL,   -- e.g. "Red", "Large"
  sku           text,
  cost_price    numeric(10, 2),
  selling_price numeric(10, 2),
  inventory     integer DEFAULT 0,
  image_url     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- ── tiktok_listings ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tiktok_listings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tiktok_title       text,
  tiktok_description text,
  tiktok_category    text,
  brand              text,
  price              numeric(10, 2),
  inventory          integer,
  listing_status     listing_status DEFAULT 'Not Prepared',
  tiktok_product_id  text,
  export_batch_id    uuid,
  last_synced_at     timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tiktok_listings_product_id ON tiktok_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_listings_status     ON tiktok_listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_tiktok_listings_batch      ON tiktok_listings(export_batch_id);

-- ── product_content_queue ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_content_queue (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  hook             text,
  short_script_15s text,
  short_script_30s text,
  caption          text,
  hashtags         text,
  cta              text,
  filming_angle    text,
  ugc_concept      text,
  status           content_queue_status DEFAULT 'Not Started',
  platform         text DEFAULT 'tiktok',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_queue_product_id ON product_content_queue(product_id);
CREATE INDEX IF NOT EXISTS idx_content_queue_status     ON product_content_queue(status);

-- ── product_import_batches ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_import_batches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source          import_source NOT NULL DEFAULT 'autods_csv',
  file_name       text,
  total_rows      integer NOT NULL DEFAULT 0,
  imported_count  integer NOT NULL DEFAULT 0,
  updated_count   integer NOT NULL DEFAULT 0,
  skipped_count   integer NOT NULL DEFAULT 0,
  error_count     integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending',  -- pending, complete, error
  error_details   jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── updated_at triggers for new tables ───────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_tiktok_listings_updated_at
    BEFORE UPDATE ON tiktok_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_content_queue_updated_at
    BEFORE UPDATE ON product_content_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── RLS for new tables ────────────────────────────────────────────────────────

ALTER TABLE product_images          ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_listings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_content_queue   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_import_batches  ENABLE ROW LEVEL SECURITY;

-- Staff can read all
CREATE POLICY "staff_read_product_images"         ON product_images         FOR SELECT USING (is_authenticated_staff());
CREATE POLICY "staff_read_product_variants"       ON product_variants       FOR SELECT USING (is_authenticated_staff());
CREATE POLICY "staff_read_tiktok_listings"        ON tiktok_listings        FOR SELECT USING (is_authenticated_staff());
CREATE POLICY "staff_read_content_queue"          ON product_content_queue  FOR SELECT USING (is_authenticated_staff());
CREATE POLICY "staff_read_import_batches"         ON product_import_batches FOR SELECT USING (is_authenticated_staff());

-- Operators and above can write
CREATE POLICY "operator_write_product_images"     ON product_images         FOR ALL USING (is_operator_or_above());
CREATE POLICY "operator_write_product_variants"   ON product_variants       FOR ALL USING (is_operator_or_above());
CREATE POLICY "operator_write_tiktok_listings"    ON tiktok_listings        FOR ALL USING (is_operator_or_above());
CREATE POLICY "operator_write_content_queue"      ON product_content_queue  FOR ALL USING (is_operator_or_above());
CREATE POLICY "operator_write_import_batches"     ON product_import_batches FOR ALL USING (is_operator_or_above());
