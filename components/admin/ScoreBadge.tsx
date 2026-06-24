import { cn } from '@/lib/utils/cn'

interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (score >= 85) return 'bg-green-100 text-green-800 border-green-200'
  if (score >= 75) return 'bg-lime-100 text-lime-800 border-lime-200'
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  if (score > 0) return 'bg-orange-100 text-orange-800 border-orange-200'
  return 'bg-gray-100 text-gray-500 border-gray-200'
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Scale Ready'
  if (score >= 85) return 'TikTok Ready'
  if (score >= 75) return 'Shopify Ready'
  if (score >= 60) return 'Partial'
  if (score > 0) return 'Low'
  return 'Not Scored'
}

export function ScoreBadge({ score, size = 'md' }: Props) {
  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }[size]

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border font-semibold',
      sizeClass,
      getScoreColor(score)
    )}>
      <span>{score}/100</span>
      <span className="font-normal opacity-70">{getScoreLabel(score)}</span>
    </span>
  )
}
