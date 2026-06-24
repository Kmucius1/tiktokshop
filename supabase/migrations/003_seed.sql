-- ============================================================
-- ViralVault Commerce OS — Seed Data
-- All products are unverified / not approved by default
-- ============================================================

-- ─────────────────────────────────────────────
-- PLACEHOLDER SUPPLIER (unverified)
-- ─────────────────────────────────────────────
insert into suppliers (
  id, name, platform, supplier_url, warehouse_country,
  processing_time_min, processing_time_max,
  shipping_time_min, shipping_time_max,
  tracking_carriers, neutral_packaging_available,
  return_supported, approved, risk_level, notes
) values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'AutoDS US Warehouse (Unverified)',
  'AutoDS',
  'https://www.autods.com',
  'United States',
  1, 3, 3, 7,
  array['USPS', 'UPS', 'FedEx'],
  true, true,
  false, 'medium',
  'Placeholder supplier — must be linked to a real AutoDS supplier before products can be approved.'
);

-- ─────────────────────────────────────────────
-- SEED PRODUCTS
-- All status: Researching, approval_status: Not Approved
-- ─────────────────────────────────────────────

-- 1. Floating waterproof phone pouch
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Floating Waterproof Phone Pouch',
  'floating-waterproof-phone-pouch',
  'Pool Day Finds',
  'Keep your phone dry and afloat at the pool or beach.',
  'A waterproof floating phone pouch that keeps your device protected and visible at the pool, beach, or lake. Universal fit for most smartphones.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  14.99, 24.99, 3.50, 0.00, null,
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600',
  array['pool', 'waterproof', 'phone', 'summer', 'beach'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 2. Beach towel clips
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Heavy-Duty Beach Towel Clips (Set of 4)',
  'beach-towel-clips-set-4',
  'Beach Bag Essentials',
  'No more towels blowing away at the beach or pool.',
  'Heavy-duty stainless steel beach towel clips that grip your towel to your chair without slipping. Wind-resistant design. Set of 4 clips included.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  12.99, 19.99, 2.80, 0.00, null,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  array['beach', 'towel', 'clips', 'summer', 'chair'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 3. Mesh beach tote
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Large Mesh Beach Tote Bag',
  'large-mesh-beach-tote-bag',
  'Beach Bag Essentials',
  'Shake the sand right out. Built for the beach.',
  'An extra-large mesh tote bag designed for beach days. Sand shakes right out through the mesh. Includes interior pocket and reinforced handles. Fits towels, sunscreen, and more.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  19.99, 34.99, 5.20, 0.00, null,
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600',
  array['beach', 'tote', 'bag', 'mesh', 'summer'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 4. Pool drink float
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Inflatable Pool Drink Float Holder',
  'inflatable-pool-drink-float-holder',
  'Pool Day Finds',
  'Keep your drink cold and within reach in the pool.',
  'An inflatable floating drink holder for the pool or lake. Fits most standard cups and bottles. Durable vinyl construction. Comes with an inflation straw.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  9.99, 16.99, 2.10, 0.00, null,
  'https://images.unsplash.com/photo-1519046904884-53ec0a9b5b6e?w=600',
  array['pool', 'drink', 'float', 'inflatable', 'summer'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 5. Portable rechargeable fan (battery flagged)
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Mini Portable Rechargeable Clip Fan',
  'mini-portable-rechargeable-clip-fan',
  'Beach Bag Essentials',
  'Stay cool anywhere — clips to strollers, chairs, and tents.',
  'A compact rechargeable clip fan with 3-speed settings and USB-C charging. Perfect for beach days, outdoor events, and travel. Built-in 2000mAh battery for up to 8 hours of use.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  22.99, 39.99, 6.50, 0.00, null,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
  array['fan', 'rechargeable', 'portable', 'beach', 'summer'],
  false, false, false,
  0, false, false,
  false, false, true, false, false, false, false
);

-- 6. Splash pad (kids product)
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Kids Outdoor Splash Pad Water Play Mat',
  'kids-outdoor-splash-pad-water-play-mat',
  'Backyard Water Fun',
  'Connect to any hose and let the kids play all summer.',
  'A 60-inch non-slip splash pad that connects to a standard garden hose. Features multiple spray jets in fun patterns. Made from thick, puncture-resistant PVC. Recommended for ages 1–12.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  24.99, 44.99, 7.00, 0.00, null,
  'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=600',
  array['splash pad', 'kids', 'backyard', 'water', 'summer'],
  false, false, false,
  0, false, false,
  false, false, false, false, true, false, false
);

-- 7. Sand-free beach mat
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Sand-Free Beach Blanket Mat (Extra Large)',
  'sand-free-beach-blanket-mat',
  'Beach Bag Essentials',
  'Sand falls through, not on you. The smartest beach blanket.',
  'A patented sand-resistant beach mat made from ultra-thin parachute nylon. Sand, dirt, and mud fall through the microscopic holes when pressed down. Folds to the size of a water bottle. 6.5ft x 5ft.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  29.99, 49.99, 7.50, 0.00, null,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  array['beach', 'mat', 'blanket', 'sand-free', 'summer'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 8. Wet/dry swimsuit bag
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Waterproof Wet-Dry Swimsuit Bag',
  'waterproof-wet-dry-swimsuit-bag',
  'Beach Bag Essentials',
  'Keep your wet swimsuit separate from your dry gear.',
  'A waterproof bag with two separate compartments — one wet, one dry. Perfect for wet swimsuits, towels, and shoes. Leakproof zipper seal. Machine washable lining.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  17.99, 28.99, 4.20, 0.00, null,
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
  array['swim', 'bag', 'waterproof', 'beach', 'summer'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 9. Inflatable tanning pool lounger (oversized)
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Inflatable Floating Tanning Pool Lounger',
  'inflatable-floating-tanning-pool-lounger',
  'Pool Day Finds',
  'The ultimate float for a pool day with the sun.',
  'A spacious inflatable pool lounger with a mesh center for tanning while staying cool. Supports up to 250 lbs. Includes two cup holders and headrest. Comes with a pump.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  34.99, 59.99, 11.00, 0.00, null,
  'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=600',
  array['pool', 'float', 'lounger', 'inflatable', 'summer'],
  false, false, false,
  0, false, false,
  true, false, false, false, false, false, false
);

-- 10. Solar patio lights
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Solar Outdoor String Patio Lights (50ft)',
  'solar-outdoor-string-patio-lights-50ft',
  'Summer Hosting',
  'Set the summer vibe without running a single extension cord.',
  'Weatherproof solar-powered string lights with 50 warm-white LED bulbs across 50ft of wire. Auto on/off at dusk. 8 lighting modes. No electricity needed.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  27.99, 44.99, 7.80, 0.00, null,
  'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600',
  array['solar', 'lights', 'patio', 'hosting', 'summer'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 11. Pool diving toys (kids)
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Pool Diving Ring Toy Set for Kids (12-Pack)',
  'pool-diving-ring-toy-set-kids-12-pack',
  'Pool Day Finds',
  'Keep the kids entertained for hours in the pool.',
  'A 12-piece set of colorful dive rings in multiple colors and sizes. Weighted to sink to the bottom. Safe for ages 5 and up. Great for swimming skills and group games.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  14.99, 24.99, 3.80, 0.00, null,
  'https://images.unsplash.com/photo-1519046904884-53ec0a9b5b6e?w=600',
  array['pool', 'kids', 'diving', 'toys', 'summer'],
  false, false, false,
  0, false, false,
  false, false, false, false, true, false, false
);

-- 12. Picnic blanket
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Waterproof Outdoor Picnic Blanket (Foldable)',
  'waterproof-outdoor-picnic-blanket-foldable',
  'Summer Hosting',
  'Soft on top, waterproof on the bottom. Perfect for any outdoor day.',
  'A large foldable picnic blanket with a soft fleece top and waterproof PEVA bottom. Folds into a compact carrying case with handle. 60 x 80 inches — fits a family of 4.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  22.99, 38.99, 5.50, 0.00, null,
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600',
  array['picnic', 'blanket', 'outdoor', 'waterproof', 'summer'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 13. Cup holder stakes
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Sand Drink Holder Stakes (Set of 4)',
  'sand-drink-holder-stakes-set-4',
  'Beach Bag Essentials',
  'Push it in the sand, drop in your drink. No more spills.',
  'Plastic drink holder stakes that push into sand or soft ground. Holds standard cups, cans, and bottles. Set of 4 in mixed colors. Great for beach, picnic, or outdoor concerts.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  11.99, 19.99, 2.50, 0.00, null,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  array['beach', 'drinks', 'stakes', 'holder', 'summer'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 14. Misting fan (battery flagged)
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Portable Handheld Misting Fan with Water Tank',
  'portable-handheld-misting-fan-water-tank',
  'Beach Bag Essentials',
  'Cool mist + fan in one — a summer essential.',
  'A rechargeable handheld fan with a built-in water mist sprayer. Fills via the USB-C port. 3 fan speeds plus mist mode. 1800mAh battery. Compact enough for your beach bag.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  21.99, 36.99, 6.20, 0.00, null,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
  array['fan', 'misting', 'portable', 'beach', 'summer'],
  false, false, false,
  0, false, false,
  false, false, true, true, false, false, false
);

-- 15. Beach umbrella anchor
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Beach Umbrella Sand Anchor with Carry Bag',
  'beach-umbrella-sand-anchor-carry-bag',
  'Beach Bag Essentials',
  'Stop chasing your umbrella down the beach.',
  'A heavy-duty screw-in beach umbrella anchor that locks into sand in seconds. Fits most standard beach umbrella poles (up to 1.5-inch diameter). Includes carry bag.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  16.99, 27.99, 4.00, 0.00, null,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  array['beach', 'umbrella', 'anchor', 'sand', 'summer'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 16. Pool toy storage mesh bag
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Pool Toy Storage Hanging Mesh Bag',
  'pool-toy-storage-hanging-mesh-bag',
  'Pool Day Finds',
  'Hang it on the fence. Toss the toys in. Done.',
  'A large hanging mesh storage bag for pool floats, noodles, and dive toys. Includes rust-resistant metal hooks for pool fence or rail. Drip-dries fast. Holds up to 20 lbs.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  18.99, 29.99, 4.80, 0.00, null,
  'https://images.unsplash.com/photo-1519046904884-53ec0a9b5b6e?w=600',
  array['pool', 'storage', 'mesh', 'toys', 'summer'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 17. Waterproof beach pouch
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Waterproof Zipper Beach Pouch with Neck Lanyard',
  'waterproof-zipper-beach-pouch-neck-lanyard',
  'Beach Bag Essentials',
  'Your keys, cards, and cash — safe and waterproof.',
  'A waterproof roll-top pouch with a clear window for phone touchscreen use. Fits most phones up to 6.9 inches. IPX8 certified. Includes adjustable neck lanyard.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  13.99, 22.99, 3.20, 0.00, null,
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600',
  array['beach', 'waterproof', 'pouch', 'phone', 'summer'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 18. Fruit ice cube tray
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Fruit-Shaped Silicone Ice Cube Tray (2-Pack)',
  'fruit-shaped-silicone-ice-cube-tray-2-pack',
  'Viral Drinkware',
  'Summer vibes in every drink. Fruit ice cubes that pop right out.',
  'A fun set of silicone trays that make fruit-shaped ice cubes including watermelons, lemons, and pineapples. BPA-free food-grade silicone. Flexible base for easy release. Pack of 2.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  11.99, 19.99, 2.80, 0.00, null,
  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600',
  array['ice', 'tray', 'fruit', 'drinkware', 'summer', 'viral'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 19. Tumbler straw topper set
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Tumbler Straw Topper Charm Set (8-Pack)',
  'tumbler-straw-topper-charm-set-8-pack',
  'Viral Drinkware',
  'Customize your cup. Summer edition charms for your straws.',
  'A set of 8 summer-themed silicone straw toppers that fit most standard reusable straws. Designs include flamingo, sun, watermelon, flip flop, pineapple, beach wave, cactus, and ice cream.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  9.99, 16.99, 2.00, 0.00, null,
  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600',
  array['tumbler', 'straw', 'charm', 'drinkware', 'summer', 'viral'],
  false, false, false,
  0, false, false,
  false, false, false, false, false, false, false
);

-- 20. Outdoor kids sprinkler toy
insert into products (
  title, slug, category, short_description, description,
  status, approval_status,
  primary_supplier_id, supplier_url,
  selling_price, compare_at_price, landed_cost, shipping_cost, margin_percent,
  hero_image_url, tags,
  approved_for_shopify, approved_for_tiktok, approved_to_scale,
  score, tracking_supported, return_supported,
  oversized, fragile, battery, liquid, child_product, restricted, trademark_risk
) values (
  'Outdoor Kids Sprinkler Spray Toy for Backyard',
  'outdoor-kids-sprinkler-spray-toy-backyard',
  'Backyard Water Fun',
  'Hook it up to the hose and let the kids run.',
  'A fun spinning sprinkler toy that connects to a standard garden hose. Water pressure controls spin speed and spray range. Made from non-toxic ABS plastic. Great for kids ages 3–10.',
  'Researching', 'Not Approved',
  'aaaaaaaa-0000-0000-0000-000000000001', null,
  19.99, 32.99, 5.00, 0.00, null,
  'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=600',
  array['kids', 'sprinkler', 'backyard', 'water', 'summer'],
  false, false, false,
  0, false, false,
  false, false, false, false, true, false, false
);

-- ─────────────────────────────────────────────
-- CONTENT ANGLES for first few products
-- ─────────────────────────────────────────────
insert into content_angles (product_id, hook, video_concept, demo_steps, target_customer, trend_reason, caption, hashtags, status)
select
  id,
  'Things I bought for summer that actually make sense',
  'Show the product solving a real summer problem in under 15 seconds',
  array[
    'Open with the problem (wet phone, blowing towel, no shade)',
    'Show the product in use at the beach or pool',
    'Close with satisfied reaction or money saved'
  ],
  'Millennial and Gen Z beach and pool enthusiasts',
  'Summer seasonal demand with strong visual demo potential',
  'This is the summer product you didn''t know you needed 🌊 #summershop #beachfinds #tiktokmademebuyit',
  array['#summershop', '#beachfinds', '#tiktokmademebuyit', '#summertok', '#poolday', '#summerproducts'],
  'draft'
from products
where slug = 'floating-waterproof-phone-pouch';

insert into content_angles (product_id, hook, video_concept, demo_steps, target_customer, trend_reason, caption, hashtags, status)
select
  id,
  'Pool day products I wish I had sooner',
  'Show kids or family enjoying the pool while using the product',
  array[
    'Start at the pool — messy situation without the product',
    'Introduce the product and show setup',
    'Show the satisfying result'
  ],
  'Parents with young kids, pool owners',
  'Family-friendly content with before/after moment',
  'Pool day just got a lot better 🏊 #poolday #summerfinds #familysummer #poolhack',
  array['#poolday', '#summerfinds', '#familysummer', '#poolhack', '#summermusthaves'],
  'draft'
from products
where slug = 'inflatable-pool-drink-float-holder';

-- ─────────────────────────────────────────────
-- RESEARCH QUEUE — additional ideas
-- ─────────────────────────────────────────────
insert into product_research_queue (
  product_idea, category, source, trend_reason, target_price,
  estimated_landed_cost, estimated_margin, tiktok_angle,
  search_keywords, priority, status
) values
(
  'Waterproof Bluetooth Speaker for Pool',
  'Pool Day Finds',
  'TikTok Trending',
  'Viral unboxing potential, strong audio demo on video',
  34.99, 9.00, 0.74,
  'Play music at the pool with no cord and no fear of water — simple 10-second demo',
  array['waterproof speaker', 'pool speaker', 'bluetooth pool', 'summer speaker'],
  'high', 'idea'
),
(
  'Retractable Beach Shade Canopy Tent',
  'Beach Bag Essentials',
  'Amazon Best Sellers',
  'Strong seasonal demand, high value perceived item for beach families',
  49.99, 18.00, 0.64,
  'Before/after — family sweating in sun, then instantly under shade',
  array['beach canopy', 'beach tent', 'beach shade', 'pop up canopy'],
  'medium', 'idea'
),
(
  'Insulated Collapsible Water Bottle',
  'Travel + Vacation Finds',
  'TikTok Trending',
  'Hydration trend is massive — visual collapse demo is perfect short-form content',
  18.99, 4.50, 0.76,
  'Collapse it down to pocket size after drinking — satisfying video',
  array['collapsible bottle', 'water bottle', 'foldable bottle', 'travel bottle'],
  'high', 'idea'
);
