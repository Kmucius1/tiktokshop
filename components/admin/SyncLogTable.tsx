import type { SyncLog } from '@/types/supabase'
import { formatDateTime } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'

interface Props {
  logs: SyncLog[]
  title?: string
}

const statusStyle: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  skipped: 'bg-yellow-100 text-yellow-700',
}

export function SyncLogTable({ logs, title = 'Sync Logs' }: Props) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
        No sync logs yet.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400">
              <th className="px-5 py-3 text-left font-medium">Action</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-left font-medium">Error</th>
              <th className="px-5 py-3 text-left font-medium">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-mono text-xs text-gray-700">{log.action}</td>
                <td className="px-5 py-3">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusStyle[log.status] ?? 'bg-gray-100')}>
                    {log.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-red-500">{log.error_message ?? '—'}</td>
                <td className="px-5 py-3 text-xs text-gray-400">{formatDateTime(log.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
