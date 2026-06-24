import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type CleanupAction =
  | 'rewrite_title'
  | 'rewrite_description'
  | 'suggest_category'
  | 'suggest_price'
  | 'generate_hook'
  | 'generate_script_15s'
  | 'generate_script_30s'
  | 'generate_caption'
  | 'generate_hashtags'
  | 'generate_ugc_angle'
  | 'flag_risks'
  | 'full_tiktok_listing'

const SYSTEM = `You are a TikTok Shop product specialist. You write clean, accurate, high-converting product copy for TikTok Seller Center listings.

Rules:
- Never make medical claims or promise health outcomes
- Never exaggerate shipping speed beyond supplier data
- Never fabricate reviews or social proof
- Never create content for weapons, adult products, or restricted items
- Flag anything that could violate TikTok Shop policies
- Keep titles under 255 characters
- Keep descriptions factual and benefit-focused
- Use plain language — TikTok buyers are mobile, fast-scrolling
- Return only the requested output, no commentary`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId, action } = await request.json() as { productId: string; action: CleanupAction }

  const { data: product } = await supabase
    .from('products')
    .select('title, description, category, selling_price, landed_cost, shipping_cost, supplier_name, supplier_url, tiktok_category')
    .eq('id', productId)
    .single()

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const context = `
Product: ${product.title}
Description: ${product.description ?? 'None'}
Category: ${product.category ?? 'Unknown'}
Selling price: $${product.selling_price ?? 'Not set'}
Cost: $${product.landed_cost ?? 'Not set'}
Shipping: $${product.shipping_cost ?? 'Not set'}
`.trim()

  const prompts: Record<CleanupAction, string> = {
    rewrite_title: `${context}\n\nRewrite this product title for TikTok Shop. Max 255 chars. No clickbait. Clear, benefit-driven. Output ONLY the new title.`,
    rewrite_description: `${context}\n\nRewrite this product description for TikTok Shop. 3–5 short benefit-focused sentences. No markdown. Output ONLY the description.`,
    suggest_category: `${context}\n\nWhat TikTok Shop category does this product belong to? Output ONLY the category name.`,
    suggest_price: `${context}\n\nSuggest a competitive retail price for TikTok Shop. Consider the cost and shipping. Output ONLY the number, e.g. 24.99`,
    generate_hook: `${context}\n\nWrite ONE viral TikTok video hook for this product. Under 15 words. Creates curiosity or urgency. No emojis. Output ONLY the hook.`,
    generate_script_15s: `${context}\n\nWrite a 15-second TikTok video script for this product. Include: hook (3s), product reveal (5s), key benefit (5s), CTA (2s). Output ONLY the script.`,
    generate_script_30s: `${context}\n\nWrite a 30-second TikTok video script. Include: hook (5s), problem (5s), product solution (10s), 2 key benefits (7s), CTA (3s). Output ONLY the script.`,
    generate_caption: `${context}\n\nWrite a TikTok post caption for this product. Under 150 chars. Engaging, benefit-focused. No fake urgency. Output ONLY the caption.`,
    generate_hashtags: `${context}\n\nGenerate 8–12 TikTok hashtags for this product. Mix of niche and broad. Output ONLY the hashtags separated by spaces, starting with #.`,
    generate_ugc_angle: `${context}\n\nSuggest a UGC (user-generated content) video concept for this product. 2–3 sentences describing the filming angle, setting, and story. Output ONLY the concept.`,
    flag_risks: `${context}\n\nAre there any TikTok Shop policy risks with this product? Check: medical claims, restricted categories, IP concerns, shipping issues, age restrictions. Output a JSON object: {"risks": ["risk1", "risk2"], "safe": true/false}`,
    full_tiktok_listing: `${context}\n\nCreate a complete TikTok Shop listing. Output a JSON object with these exact keys: {"tiktok_title": "", "tiktok_description": "", "tiktok_category": "", "hook": "", "caption": "", "hashtags": "", "ugc_concept": ""}`,
  }

  try {
    const message = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     SYSTEM,
      messages:   [{ role: 'user', content: prompts[action] }],
    })

    const text = (message.content[0] as { type: string; text: string }).text.trim()

    // For JSON actions, parse and save
    if (action === 'full_tiktok_listing' || action === 'flag_risks') {
      try {
        const json = JSON.parse(text.replace(/```json\n?|\n?```/g, ''))

        if (action === 'full_tiktok_listing') {
          // Save to tiktok_listings table
          await supabase.from('tiktok_listings').upsert({
            product_id:         productId,
            tiktok_title:       json.tiktok_title,
            tiktok_description: json.tiktok_description,
            tiktok_category:    json.tiktok_category,
            listing_status:     'Draft Ready',
            updated_at:         new Date().toISOString(),
          }, { onConflict: 'product_id' })

          // Save content to product_content_queue
          await supabase.from('product_content_queue').upsert({
            product_id: productId,
            hook:        json.hook,
            caption:     json.caption,
            hashtags:    json.hashtags,
            ugc_concept: json.ugc_concept,
            status:      'Script Ready',
            updated_at:  new Date().toISOString(),
          }, { onConflict: 'product_id' })

          await supabase.from('products').update({
            listing_status:       'Draft Ready',
            content_queue_status: 'Script Ready',
          }).eq('id', productId)
        }

        return NextResponse.json({ result: json })
      } catch {
        return NextResponse.json({ result: text })
      }
    }

    // Save content fields individually
    const fieldMap: Partial<Record<CleanupAction, string>> = {
      generate_hook:       'hook',
      generate_script_15s: 'short_script_15s',
      generate_script_30s: 'short_script_30s',
      generate_caption:    'caption',
      generate_hashtags:   'hashtags',
      generate_ugc_angle:  'ugc_concept',
    }

    if (fieldMap[action]) {
      await supabase.from('product_content_queue').upsert({
        product_id:       productId,
        [fieldMap[action]!]: text,
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'product_id' })
    }

    if (action === 'rewrite_title') {
      await supabase.from('products').update({ title: text }).eq('id', productId)
    }
    if (action === 'rewrite_description') {
      await supabase.from('products').update({ description: text }).eq('id', productId)
    }
    if (action === 'suggest_category') {
      await supabase.from('products').update({ tiktok_category: text }).eq('id', productId)
    }

    return NextResponse.json({ result: text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
