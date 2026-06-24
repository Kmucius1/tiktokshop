'use client'

import { useState } from 'react'
import { formatMoney, formatPercent } from '@/lib/utils/money'
import { calcMarginPercent, calcEstimatedProfit } from '@/lib/scoring/product-score'

interface Props {
  initialSellingPrice?: number
  initialLandedCost?: number
  initialShippingCost?: number
}

export function MarginCalculator({
  initialSellingPrice = 0,
  initialLandedCost = 0,
  initialShippingCost = 0,
}: Props) {
  const [sellingPrice, setSellingPrice] = useState(initialSellingPrice)
  const [landedCost, setLandedCost] = useState(initialLandedCost)
  const [shippingCost, setShippingCost] = useState(initialShippingCost)
  const [tiktokFee, setTiktokFee] = useState(0.08) // 8% placeholder
  const [adBudget, setAdBudget] = useState(0)

  const profit = calcEstimatedProfit(sellingPrice, landedCost, shippingCost)
  const marginPct = calcMarginPercent(sellingPrice, landedCost, shippingCost)
  const tiktokFeeAmount = sellingPrice * tiktokFee
  const netProfit = profit - tiktokFeeAmount - adBudget
  const netMargin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0

  const field = (label: string, value: number, setter: (v: number) => void, prefix = '$') => (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{prefix}</span>
        <input
          type="number"
          value={value}
          onChange={e => setter(parseFloat(e.target.value) || 0)}
          step="0.01"
          min="0"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
    </div>
  )

  const stat = (label: string, value: string, color = 'text-gray-900') => (
    <div className="flex justify-between py-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Margin Calculator</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {field('Selling Price', sellingPrice, setSellingPrice)}
        {field('Product / Landed Cost', landedCost, setLandedCost)}
        {field('Shipping Cost', shippingCost, setShippingCost)}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">TikTok Fee %</label>
          <div className="relative">
            <input
              type="number"
              value={(tiktokFee * 100).toFixed(0)}
              onChange={e => setTiktokFee((parseFloat(e.target.value) || 0) / 100)}
              step="1"
              min="0"
              max="100"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">Placeholder — confirm with TikTok</p>
        </div>
        {field('Ad Test Budget (per unit)', adBudget, setAdBudget)}
      </div>

      <div className="mt-4 divide-y divide-gray-100 rounded-lg bg-gray-50 px-4">
        {stat('Selling Price', formatMoney(sellingPrice))}
        {stat('Product Cost', formatMoney(landedCost))}
        {stat('Shipping Cost', formatMoney(shippingCost))}
        {stat('Gross Profit', formatMoney(profit), profit >= 0 ? 'text-green-700' : 'text-red-600')}
        {stat('Gross Margin', formatPercent(marginPct), marginPct >= 40 ? 'text-green-700' : 'text-red-600')}
        <div className="border-t border-gray-200 pt-2">
          {stat('TikTok Fee (est.)', formatMoney(tiktokFeeAmount), 'text-orange-600')}
          {stat('Ad Budget', formatMoney(adBudget), 'text-orange-600')}
          {stat('Net Profit (est.)', formatMoney(netProfit), netProfit >= 0 ? 'text-green-700' : 'text-red-600')}
          {stat('Net Margin (est.)', formatPercent(netMargin), netMargin >= 30 ? 'text-green-700' : 'text-red-600')}
        </div>
      </div>

      {marginPct < 40 && sellingPrice > 0 && (
        <p className="mt-3 text-xs text-red-600">
          ⚠ Gross margin is below 40% — product will score 0 on margin. Net margin after TikTok fees may be negative.
        </p>
      )}
    </div>
  )
}
