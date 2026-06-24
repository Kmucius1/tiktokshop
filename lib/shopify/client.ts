// Shopify Admin API client
// TODO: Replace placeholder with real credentials in .env.local

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN
const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2024-01'

export function getShopifyBaseUrl(): string {
  if (!SHOPIFY_STORE_DOMAIN) throw new Error('SHOPIFY_STORE_DOMAIN is not set')
  return `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}`
}

export async function shopifyFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!SHOPIFY_ADMIN_ACCESS_TOKEN) {
    throw new Error('SHOPIFY_ADMIN_ACCESS_TOKEN is not set')
  }

  const url = `${getShopifyBaseUrl()}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Shopify API error ${response.status}: ${error}`)
  }

  return response.json() as Promise<T>
}
