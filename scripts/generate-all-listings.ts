import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  'https://clvbsdxemchfoctokgrf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

async function generateForProduct(product: {
  id: string
  title: string
  description: string | null
  category: string
  tiktok_category: string | null
  landed_cost: number | null
  shipping_cost: number | null
  selling_price: number | null
  review_notes: string | null
}) {
  const context = `
Product: ${product.title}
Category: ${product.category}
TikTok Category: ${product.tiktok_category ?? product.category}
Description: ${product.description ?? ''}
Selling Price: $${product.selling_price}
Notes: ${product.review_notes ?? ''}
  `.trim()

  console.log(`\n⚡ Generating for: ${product.title}`)

  const prompt = `You are a TikTok Shop product expert. Generate a complete TikTok Shop listing and content package for this product.

${context}

Return a JSON object with EXACTLY these fields (no extra text, just JSON):
{
  "tiktok_title": "Optimized title under 34 chars, benefit-first, no emojis",
  "tiktok_description": "3-4 sentences. Lead with the problem it solves, then the solution, then a social proof line. No hashtags here.",
  "tiktok_category": "Best TikTok Shop category",
  "brand": "Generic",
  "hook": "1 punchy sentence under 10 words that stops the scroll. Make it feel like a secret or discovery.",
  "short_script_15s": "A 15-second TikTok script. Format: Hook (2s) → Problem (3s) → Product reveal (5s) → Result (3s) → CTA (2s). Write it conversational, like talking to a friend.",
  "short_script_30s": "A 30-second TikTok script with more detail. Same format but expanded. Include a wow moment.",
  "caption": "TikTok caption under 150 chars. Conversational, ends with a question or CTA.",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5 #hashtag6 (6-8 hashtags, mix niche + broad)",
  "cta": "Short call to action under 10 words",
  "filming_angle": "Specific filming direction: what to show, what angle, what lighting, any props needed",
  "ugc_concept": "A UGC creator brief: describe the person, the setting, the story arc, the reaction moment"
}`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON returned')

  const data = JSON.parse(jsonMatch[0])

  // Save TikTok listing
  const { data: existingListing } = await supabase
    .from('tiktok_listings')
    .select('id')
    .eq('product_id', product.id)
    .single()

  if (existingListing) {
    await supabase.from('tiktok_listings').update({
      tiktok_title: data.tiktok_title,
      tiktok_description: data.tiktok_description,
      tiktok_category: data.tiktok_category,
      brand: data.brand,
      price: product.selling_price,
      listing_status: 'Draft Ready',
      updated_at: new Date().toISOString(),
    }).eq('id', existingListing.id)
  } else {
    await supabase.from('tiktok_listings').insert({
      product_id: product.id,
      tiktok_title: data.tiktok_title,
      tiktok_description: data.tiktok_description,
      tiktok_category: data.tiktok_category,
      brand: data.brand,
      price: product.selling_price,
      listing_status: 'Draft Ready',
    })
  }

  // Save content queue
  const { data: existingContent } = await supabase
    .from('product_content_queue')
    .select('id')
    .eq('product_id', product.id)
    .single()

  if (existingContent) {
    await supabase.from('product_content_queue').update({
      hook: data.hook,
      short_script_15s: data.short_script_15s,
      short_script_30s: data.short_script_30s,
      caption: data.caption,
      hashtags: data.hashtags,
      cta: data.cta,
      filming_angle: data.filming_angle,
      ugc_concept: data.ugc_concept,
      status: 'Script Ready',
      updated_at: new Date().toISOString(),
    }).eq('id', existingContent.id)
  } else {
    await supabase.from('product_content_queue').insert({
      product_id: product.id,
      hook: data.hook,
      short_script_15s: data.short_script_15s,
      short_script_30s: data.short_script_30s,
      caption: data.caption,
      hashtags: data.hashtags,
      cta: data.cta,
      filming_angle: data.filming_angle,
      ugc_concept: data.ugc_concept,
      status: 'Script Ready',
    })
  }

  // Update product status
  await supabase.from('products').update({
    listing_status: 'Draft Ready',
    content_queue_status: 'Script Ready',
    tiktok_category: data.tiktok_category,
    updated_at: new Date().toISOString(),
  }).eq('id', product.id)

  console.log(`  ✓ Listing: "${data.tiktok_title}"`)
  console.log(`  ✓ Hook: "${data.hook}"`)
}

async function run() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, description, category, tiktok_category, landed_cost, shipping_cost, selling_price, review_notes')
    .order('created_at')

  if (error || !products?.length) {
    console.error('Could not fetch products:', error?.message)
    process.exit(1)
  }

  console.log(`Generating TikTok listings + content for ${products.length} products...`)

  for (const product of products) {
    try {
      await generateForProduct(product)
    } catch (err) {
      console.error(`  ✗ Failed for "${product.title}":`, err)
    }
  }

  console.log('\n✅ All done. Refresh your admin to see the listings.')
}

run()
