// TikTok Shop API client
// TODO: Connect after TIKTOK_SHOP_APP_KEY, TIKTOK_SHOP_APP_SECRET, TIKTOK_SHOP_ACCESS_TOKEN are set

const TIKTOK_SHOP_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY
const TIKTOK_SHOP_ACCESS_TOKEN = process.env.TIKTOK_SHOP_ACCESS_TOKEN
const TIKTOK_BASE_URL = 'https://open-api.tiktokglobalshop.com'

export async function tiktokFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!TIKTOK_SHOP_APP_KEY || !TIKTOK_SHOP_ACCESS_TOKEN) {
    throw new Error('TikTok Shop credentials not configured. Set TIKTOK_SHOP_APP_KEY and TIKTOK_SHOP_ACCESS_TOKEN.')
  }

  const url = `${TIKTOK_BASE_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'x-tts-access-token': TIKTOK_SHOP_ACCESS_TOKEN,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`TikTok Shop API error ${response.status}: ${error}`)
  }

  const data = await response.json() as { code: number; message: string; data: T }

  if (data.code !== 0) {
    throw new Error(`TikTok Shop API error: ${data.message}`)
  }

  return data.data
}
