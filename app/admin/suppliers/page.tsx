export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { RiskBadge } from '@/components/admin/RiskBadge'
import { formatDate } from '@/lib/utils/dates'
import Link from 'next/link'
import { Plus, CheckCircle2, XCircle } from 'lucide-react'

export default async function SuppliersPage() {
  const supabase = await createClient()

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false })

  // Product count per supplier
  const { data: productCounts } = await supabase
    .from('products')
    .select('primary_supplier_id')

  const countMap: Record<string, number> = {}
  ;(productCounts ?? []).forEach(p => {
    if (p.primary_supplier_id) {
      countMap[p.primary_supplier_id] = (countMap[p.primary_supplier_id] ?? 0) + 1
    }
  })

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="mt-1 text-sm text-gray-500">{suppliers?.length ?? 0} suppliers in system</p>
        </div>
        <Link
          href="/admin/suppliers/new"
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Supplier
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-5 py-3 text-left font-medium">Supplier</th>
                <th className="px-4 py-3 text-left font-medium">Platform</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Risk</th>
                <th className="px-4 py-3 text-left font-medium">Warehouse</th>
                <th className="px-4 py-3 text-left font-medium">Processing</th>
                <th className="px-4 py-3 text-left font-medium">Shipping</th>
                <th className="px-4 py-3 text-left font-medium">Tracking</th>
                <th className="px-4 py-3 text-left font-medium">Returns</th>
                <th className="px-4 py-3 text-left font-medium">Products</th>
                <th className="px-4 py-3 text-left font-medium">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(suppliers ?? []).map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      {s.supplier_url && (
                        <a href={s.supplier_url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:underline">
                          View supplier
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.platform}</td>
                  <td className="px-4 py-3">
                    {s.approved
                      ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Approved</span>
                      : <span className="flex items-center gap-1 text-orange-600 text-xs font-medium"><XCircle className="h-3.5 w-3.5" /> Not Approved</span>}
                  </td>
                  <td className="px-4 py-3"><RiskBadge level={s.risk_level} /></td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.warehouse_country ?? '—'}
                    {s.warehouse_state ? `, ${s.warehouse_state}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.processing_time_min !== null && s.processing_time_max !== null
                      ? `${s.processing_time_min}–${s.processing_time_max}d`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.shipping_time_min !== null && s.shipping_time_max !== null
                      ? `${s.shipping_time_min}–${s.shipping_time_max}d`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.tracking_carriers?.join(', ') ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.return_supported
                      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                      : <XCircle className="h-4 w-4 text-gray-300" />}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 font-medium">
                    {countMap[s.id] ?? 0}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(s.last_verified_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(suppliers ?? []).length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            No suppliers yet. <Link href="/admin/suppliers/new" className="text-sky-600 hover:underline">Add the first supplier.</Link>
          </div>
        )}
      </div>
    </div>
  )
}
