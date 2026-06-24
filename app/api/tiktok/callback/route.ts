// TikTok Shop OAuth callback
// Receives the auth code after seller authorizes the app in TikTok Seller Center.
// Exchanges it for an access token and saves it to the environment via log.

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const code      = searchParams.get('code')
  const appKey    = searchParams.get('app_key')
  const state     = searchParams.get('state')
  const errCode   = searchParams.get('errcode')
  const errMsg    = searchParams.get('errmsg')

  // TikTok sends errcode if the seller denied access
  if (errCode && errCode !== '0') {
    return NextResponse.redirect(
      new URL(`/admin/settings?tiktok_error=${encodeURIComponent(errMsg ?? 'Access denied')}`, request.nextUrl.origin)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/settings?tiktok_error=No+auth+code+received', request.nextUrl.origin)
    )
  }

  // Exchange code for access token
  const appSecret = process.env.TIKTOK_SHOP_APP_SECRET
  const key       = appKey ?? process.env.TIKTOK_SHOP_APP_KEY

  if (!appSecret || !key) {
    return NextResponse.redirect(
      new URL('/admin/settings?tiktok_error=App+credentials+not+configured', request.nextUrl.origin)
    )
  }

  try {
    const tokenRes = await fetch(
      `https://auth.tiktok-shops.com/api/v2/token/get?app_key=${key}&app_secret=${appSecret}&auth_code=${code}&grant_type=authorized_code`,
      { method: 'GET' }
    )

    const tokenData = await tokenRes.json() as {
      code: number
      data?: {
        access_token: string
        refresh_token: string
        access_token_expire_in: number
        refresh_token_expire_in: number
        seller_name: string
        seller_base_region: string
      }
      message: string
      request_id: string
    }

    if (tokenData.code !== 0 || !tokenData.data) {
      return NextResponse.redirect(
        new URL(`/admin/settings?tiktok_error=${encodeURIComponent(tokenData.message ?? 'Token exchange failed')}`, request.nextUrl.origin)
      )
    }

    const { access_token, refresh_token, seller_name } = tokenData.data

    // Redirect to admin settings with the tokens in the URL so you can copy and save them
    // (Never auto-write env vars — you must add these to Vercel manually)
    const successUrl = new URL('/admin/settings', request.nextUrl.origin)
    successUrl.searchParams.set('tiktok_connected', '1')
    successUrl.searchParams.set('seller', seller_name)
    successUrl.searchParams.set('access_token', access_token)
    successUrl.searchParams.set('refresh_token', refresh_token)

    return NextResponse.redirect(successUrl)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.redirect(
      new URL(`/admin/settings?tiktok_error=${encodeURIComponent(msg)}`, request.nextUrl.origin)
    )
  }
}
