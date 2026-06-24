import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('product_id')
  const sourceSection = searchParams.get('source_section') ?? 'unknown'

  if (!productId) {
    return NextResponse.json({ error: 'product_id required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('id, title, amazon_affiliate_url, amazon_tracking_id, affiliate_network, marketplace, published, status')
    .eq('id', productId)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  if (!product.amazon_affiliate_url) {
    return NextResponse.json({ error: 'No affiliate URL on this product' }, { status: 422 })
  }

  // Hash the IP — never store raw
  const rawIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
  const ipHash = createHash('sha256').update(rawIp + process.env.NEXT_PUBLIC_SUPABASE_URL).digest('hex')

  const sourcePage = request.headers.get('referer') ?? 'direct'
  const userAgent = request.headers.get('user-agent') ?? ''

  // Look up default tracking ID from settings if product doesn't have one
  const { data: settings } = await supabase
    .from('amazon_settings')
    .select('default_amazon_tracking_id')
    .limit(1)
    .single()

  const trackingId = product.amazon_tracking_id ?? settings?.default_amazon_tracking_id ?? null

  // Log the click
  await supabase.from('affiliate_clicks').insert({
    product_id: product.id,
    affiliate_url: product.amazon_affiliate_url,
    marketplace: product.marketplace ?? 'Amazon',
    affiliate_network: product.affiliate_network ?? 'Amazon Associates',
    tracking_id: trackingId,
    source_page: sourcePage,
    source_section: sourceSection,
    referrer: sourcePage,
    user_agent: userAgent,
    ip_hash: ipHash,
  })

  // Increment click count on product
  await supabase.rpc('increment_affiliate_clicks', { product_uuid: product.id })

  // Redirect to the affiliate URL
  return NextResponse.redirect(product.amazon_affiliate_url, { status: 302 })
}
