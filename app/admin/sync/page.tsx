export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { SyncLogTable } from '@/components/admin/SyncLogTable'
import { AutoDSCsvImport } from '@/components/admin/AutoDSCsvImport'

export default async function SyncPage() {
  const supabase = await createClient()

  const [
    { data: shopifyLogs },
    { data: tiktokLogs },
    { data: autoDSLogs },
  ] = await Promise.all([
    supabase.from('shopify_sync_logs').select('*').order('created_at', { ascending: false }).limit(25),
    supabase.from('tiktok_sync_logs').select('*').order('created_at', { ascending: false }).limit(25),
    supabase.from('autods_sync_logs').select('*').order('created_at', { ascending: false }).limit(25),
  ])

  const errorCount = (logs: typeof shopifyLogs) =>
    (logs ?? []).filter(l => l.status === 'error').length

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sync Logs</h1>
        <p className="mt-1 text-sm text-gray-500">Shopify, marketplace, and AutoDS sync activity</p>
      </div>

      {/* Status overview */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { name: 'Shopify', logs: shopifyLogs, note: 'Requires SHOPIFY_STORE_DOMAIN + SHOPIFY_ADMIN_ACCESS_TOKEN' },
          { name: 'marketplace', logs: tiktokLogs, note: 'Requires marketplace credentials when enabled' },
          { name: 'AutoDS', logs: autoDSLogs, note: 'Requires AUTODS_API_KEY' },
        ].map(({ name, logs, note }) => {
          const errors = errorCount(logs)
          return (
            <div key={name} className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm font-semibold text-gray-700">{name}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{logs?.length ?? 0}</p>
              <p className="text-xs text-gray-400">sync events</p>
              {errors > 0 ? (
                <p className="mt-2 text-sm font-semibold text-red-600">{errors} errors</p>
              ) : (
                <p className="mt-2 text-xs text-gray-400">No errors</p>
              )}
              <p className="mt-2 text-xs text-orange-600">{note}</p>
            </div>
          )
        })}
      </div>

      {/* AutoDS CSV Import */}
      <div className="mb-8">
        <AutoDSCsvImport />
      </div>

      <div className="space-y-6">
        <SyncLogTable logs={shopifyLogs ?? []} title="Shopify Sync Logs" />
        <SyncLogTable logs={tiktokLogs ?? []} title="Marketplace Sync Logs" />
        <SyncLogTable logs={autoDSLogs ?? []} title="AutoDS Sync Logs" />
      </div>
    </div>
  )
}
