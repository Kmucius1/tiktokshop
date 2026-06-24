'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  productId: string
  published: boolean
}

export function PublishToggle({ productId, published }: Props) {
  const [value, setValue] = useState(published)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    const next = !value
    setValue(next)
    await supabase.from('products').update({
      published: next,
      status: next ? 'Live' : 'Paused',
      updated_at: new Date().toISOString(),
    }).eq('id', productId)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={value ? 'Live — click to unpublish' : 'Draft — click to publish'}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        value ? 'bg-green-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
