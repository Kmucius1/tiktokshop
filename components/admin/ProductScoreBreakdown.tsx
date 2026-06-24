import type { ScoreBreakdown } from '@/types/supabase'
import { cn } from '@/lib/utils/cn'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface Props {
  breakdown: ScoreBreakdown
}

const categories = [
  { key: 'shipping_speed' as const, label: 'Shipping Speed', max: 20 },
  { key: 'tracking' as const, label: 'Tracking Reliability', max: 15 },
  { key: 'warehouse' as const, label: 'US / Verified Warehouse', max: 15 },
  { key: 'margin' as const, label: 'Margin', max: 15 },
  { key: 'tiktok_demo' as const, label: 'TikTok Demo Potential', max: 15 },
  { key: 'return_risk' as const, label: 'Low Return Risk', max: 10 },
  { key: 'compliance' as const, label: 'Compliance / IP Safety', max: 10 },
]

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? (score / max) * 100 : 0
  const color = score === max ? 'bg-green-500' : score > 0 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-gray-100">
        <div className={cn('h-2 rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-sm font-semibold text-gray-700">
        {score}/{max}
      </span>
    </div>
  )
}

export function ProductScoreBreakdown({ breakdown }: Props) {
  return (
    <div className="space-y-6">
      {/* Total score */}
      <div className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-5">
        <div>
          <p className="text-sm font-medium text-gray-500">Total Score</p>
          <p className="text-4xl font-bold text-gray-900">{breakdown.total}<span className="text-xl text-gray-400">/100</span></p>
        </div>
        <div className="space-y-1 text-right text-sm">
          <div className={cn('flex items-center gap-1.5 justify-end', breakdown.approved_for_tiktok ? 'text-green-600' : 'text-gray-400')}>
            {breakdown.approved_for_tiktok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            Ready for TikTok
          </div>
          <div className={cn('flex items-center gap-1.5 justify-end', breakdown.approved_to_scale ? 'text-emerald-600' : 'text-gray-400')}>
            {breakdown.approved_to_scale ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            Ready to Scale
          </div>
        </div>
      </div>

      {/* Category bars */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Score Breakdown</h3>
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.key}>
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>{cat.label}</span>
              </div>
              <ScoreBar score={breakdown[cat.key]} max={cat.max} />
            </div>
          ))}
        </div>
      </div>

      {/* Disqualifiers */}
      {breakdown.disqualifiers.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-700">
            <XCircle className="h-4 w-4" /> Disqualifiers
          </h3>
          <ul className="space-y-1">
            {breakdown.disqualifiers.map((d, i) => (
              <li key={i} className="text-sm text-red-700">• {d}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {breakdown.recommendations.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertCircle className="h-4 w-4" /> What to Fix
          </h3>
          <ul className="space-y-1">
            {breakdown.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-amber-800">• {r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
