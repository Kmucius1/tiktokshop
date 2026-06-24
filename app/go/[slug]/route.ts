import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, slug, amazon_affiliate_url, amazon_product_url, amazon_tracking_id, affiliate_network, marketplace')
    .eq('slug', slug)
    .single()

  const destination = product?.amazon_affiliate_url ?? product?.amazon_product_url ?? 'https://amazon.com'

  // Fire-and-forget tracking — never block the redirect
  if (product) {
    const rawIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'
    const ipHash = createHash('sha256')
      .update(rawIp + (process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'salt'))
      .digest('hex')
    const sourcePage = request.headers.get('referer') ?? 'direct'
    const userAgent = request.headers.get('user-agent') ?? ''
    const sourceSection = new URL(request.url).searchParams.get('from') ?? 'go'

    ;(async () => {
      try {
        await supabase.from('affiliate_clicks').insert({
          product_id: product.id,
          affiliate_url: destination,
          marketplace: product.marketplace ?? 'Amazon',
          affiliate_network: product.affiliate_network ?? 'Amazon Associates',
          tracking_id: product.amazon_tracking_id ?? null,
          source_page: sourcePage,
          source_section: sourceSection,
          referrer: sourcePage,
          user_agent: userAgent,
          ip_hash: ipHash,
        })
        await supabase.rpc('increment_affiliate_clicks', { product_uuid: product.id })
      } catch {
        // tracking failures must never block the redirect
      }
    })()
  }

  return NextResponse.redirect(destination, { status: 302 })
}
