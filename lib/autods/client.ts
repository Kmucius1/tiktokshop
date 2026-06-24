// AutoDS API client
// TODO: Connect after AUTODS_API_KEY is set

const AUTODS_API_KEY = process.env.AUTODS_API_KEY
const AUTODS_BASE_URL = 'https://api.autods.com/v2'

export async function autoDSFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!AUTODS_API_KEY) {
    throw new Error('AUTODS_API_KEY is not set')
  }

  const url = `${AUTODS_BASE_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${AUTODS_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AutoDS API error ${response.status}: ${error}`)
  }

  return response.json() as Promise<T>
}
