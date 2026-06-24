'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AdminNote } from '@/types/supabase'
import { formatDateTime } from '@/lib/utils/dates'

interface Props {
  entityType: string
  entityId: string
  notes: AdminNote[]
  onAdded?: () => void
}

export function AdminNoteForm({ entityType, entityId, notes, onAdded }: Props) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('admin_notes').insert({
      entity_type: entityType,
      entity_id: entityId,
      admin_id: user?.id ?? null,
      note: note.trim(),
    })

    setNote('')
    setLoading(false)
    onAdded?.()
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-700">Admin Notes</h3>
      </div>

      {/* Existing notes */}
      {notes.length > 0 ? (
        <ul className="divide-y divide-gray-50">
          {notes.map(n => (
            <li key={n.id} className="px-5 py-3">
              <p className="text-sm text-gray-700">{n.note}</p>
              <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.created_at)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-gray-400">No notes yet.</p>
      )}

      {/* Add note */}
      <form onSubmit={handleSubmit} className="border-t border-gray-100 px-5 py-4">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          placeholder="Add a note..."
          className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={loading || !note.trim()}
          className="mt-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-gray-800"
        >
          {loading ? 'Saving...' : 'Add Note'}
        </button>
      </form>
    </div>
  )
}
