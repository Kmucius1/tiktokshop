export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils/dates'
import { formatMoney, formatPercent } from '@/lib/utils/money'
import Link from 'next/link'

const priorityBadge = (p: string) => {
  const styles: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-blue-100 text-blue-700',
    low: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[p] ?? 'bg-gray-100'}`}>
      {p}
    </span>
  )
}

const statusBadge = (s: string) => {
  const styles: Record<string, string> = {
    idea: 'bg-purple-100 text-purple-700',
    in_review: 'bg-yellow-100 text-yellow-700',
    added: 'bg-green-100 text-green-700',
    rejected: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[s] ?? 'bg-gray-100'}`}>
      {s.replace('_', ' ')}
    </span>
  )
}

export default async function ResearchPage() {
  const supabase = await createClient()

  const { data: queue } = await supabase
    .from('product_research_queue')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Research Queue</h1>
          <p className="mt-1 text-sm text-gray-500">{queue?.length ?? 0} product ideas</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-5 py-3 text-left font-medium">Product Idea</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Target Price</th>
                <th className="px-4 py-3 text-left font-medium">Est. Cost</th>
                <th className="px-4 py-3 text-left font-medium">Est. Margin</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(queue ?? []).map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{item.product_idea}</p>
                    {item.trend_reason && (
                      <p className="text-xs text-gray-400">{item.trend_reason}</p>
                    )}
                    {item.tiktok_angle && (
                      <p className="mt-1 text-xs text-sky-600 italic">"{item.tiktok_angle}"</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.category ?? '—'}</td>
                  <td className="px-4 py-3">{priorityBadge(item.priority)}</td>
                  <td className="px-4 py-3">{statusBadge(item.status)}</td>
                  <td className="px-4 py-3">{formatMoney(item.target_price)}</td>
                  <td className="px-4 py-3">{formatMoney(item.estimated_landed_cost)}</td>
                  <td className="px-4 py-3">
                    {item.estimated_margin !== null
                      ? <span className={item.estimated_margin >= 0.4 ? 'text-green-600 font-medium' : 'text-red-600'}>
                          {formatPercent(item.estimated_margin * 100)}
                        </span>
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.source ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(queue ?? []).length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">Research queue is empty.</div>
        )}
      </div>
    </div>
  )
}
