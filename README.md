# ViralVault Commerce OS

A full production-grade marketplace + Shopify dropshipping operating system.

Business: ViralVault — Amazon affiliate-first viral product discovery platform
**Tech:** Next.js 15, TypeScript, Tailwind CSS, Supabase, PostgreSQL

---

## What This Is

This is not a storefront. It is a commerce operating system.

Every product passes a scoring engine and approval pipeline before it can be sold. No product goes live on marketplace without admin approval. The storefront only shows verified, approved products.

- **Admin Dashboard** (`/admin`) — product research, scoring, supplier review, fulfillment monitoring
- **Public Storefront** (`/`) — customer-facing shop showing only live, approved products

---

## Installation

### 1. Install dependencies
```bash
npm install
```

### 2. Create Supabase project
1. Go to supabase.com and create a new project
2. Go to Settings → API and copy your Project URL, Anon key, and Service role key

### 3. Set environment variables
```bash
cp .env.local.example .env.local
```
Fill in your Supabase credentials. Leave Shopify/marketplace/AutoDS blank for now.

### 4. Run SQL migrations
In Supabase SQL Editor, run each file in order:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_seed.sql`

### 5. Create first admin user
1. In Supabase → Authentication → Users, add a new user
2. In Table Editor → profiles, change that user's role to `owner`

### 6. Run dev server
```bash
npm run dev
```
- Admin: http://localhost:3000/admin
- Storefront: http://localhost:3000

---

## Scoring Engine (100 points)

| Category | Max |
|---|---|
| Shipping speed | 20 |
| Tracking reliability | 15 |
| US or verified warehouse | 15 |
| Margin | 15 |
| marketplace demo potential | 15 |
| Low return risk | 10 |
| Compliance / IP safety | 10 |

**Shopify approval:** score ≥ 75, no disqualifiers, supplier assigned  
**marketplace approval:** score ≥ 85, US warehouse, handling ≤2d, delivery ≤6d, return policy, no compliance risk  
**Scale ready:** score ≥ 90, marketplace approved, no exceptions

---

## Connecting Shopify
Add to `.env.local`:
```
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxx
SHOPIFY_API_VERSION=2024-01
```

## Connecting marketplace
```
TIKTOK_SHOP_APP_KEY=
TIKTOK_SHOP_APP_SECRET=
TIKTOK_SHOP_ACCESS_TOKEN=
```
Only products with `approved_for_tiktok = true` can be pushed.

## Connecting AutoDS
```
AUTODS_API_KEY=
```

---

## Seed Products
20 summer products in Researching status, all unverified, none visible on storefront until approved through the admin pipeline.

---

## User Roles
| Role | marketplace Approvals |
|---|---|
| owner | Yes |
| admin | Yes |
| operator | No — can add/edit products |
| viewer | Read only |
