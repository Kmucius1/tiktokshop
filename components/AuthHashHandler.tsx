'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Intercepts Supabase implicit-flow hash tokens (password recovery, magic links).
// Supabase emails contain links like:
//   http://localhost:3000/#access_token=...&type=recovery
// The hash is never sent to the server, so we handle it here on the client.
export function AuthHashHandler() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash || !hash.includes('access_token')) return

    const params = new URLSearchParams(hash.replace('#', ''))
    const type = params.get('type')
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) return

    const supabase = createClient()

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          router.push('/admin/login?error=link_expired')
          return
        }
        if (type === 'recovery') {
          router.push('/auth/update-password')
        } else {
          router.push('/admin')
        }
      })
  }, [router])

  return null
}
