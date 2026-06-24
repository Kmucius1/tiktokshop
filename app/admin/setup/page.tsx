'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSetupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })

    const data = await res.json() as { success?: boolean; error?: string }

    if (!res.ok) {
      setError(data.error ?? 'Setup failed. Please try again.')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/admin/login'), 2500)
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-8 text-center shadow-xl">
          <div className="mb-4 text-5xl">✅</div>
          <p className="text-lg font-bold text-white">Account created!</p>
          <p className="mt-2 text-sm text-gray-400">Redirecting you to sign in…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <span className="text-2xl font-extrabold text-white">TikTokShop.art</span>
            <span className="rounded bg-pink-600 px-1.5 py-0.5 text-xs font-bold text-white">Admin</span>
          </div>
          <p className="mt-2 text-sm text-gray-400">Create your admin account</p>
          <p className="mt-1 text-xs text-yellow-500/80">One-time setup · disabled once your account exists</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-gray-900 p-7 shadow-xl">
          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Zoe Taylor"
              autoComplete="name"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 transition focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 transition focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 transition focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-pink-600 py-3 text-sm font-semibold text-white transition hover:bg-pink-500 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create Admin Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-gray-600">
          Already have an account?{' '}
          <a href="/admin/login" className="text-gray-400 underline hover:text-white">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
