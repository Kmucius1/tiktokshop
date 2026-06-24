import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-block text-sm text-sky-600 hover:underline">← Back to home</Link>
        <h1 className="mb-8 text-3xl font-bold text-gray-900">About ViralVault</h1>

        <div className="space-y-6 text-gray-600">
          <p className="text-lg leading-relaxed">
            ViralVault is a curated product discovery platform built to help shoppers find real viral products before they buy fake ones. We organize trending Amazon finds, internet-famous gadgets, TikTok-made-me-buy-it products, problem solvers, and useful everyday items in one place. For Amazon affiliate products, ViralVault does not handle checkout, shipping, returns, or customer service. Amazon or the marketplace seller handles the purchase, while ViralVault helps customers discover, compare, and click through to trusted product links. Some links may be affiliate links. As an Amazon Associate, we may earn from qualifying purchases at no extra cost to you.
          </p>

          <p>
            ViralVault is an Amazon affiliate-first product discovery platform. For Amazon affiliate products, Amazon or the marketplace seller handles checkout, shipping, returns, and customer service. ViralVault helps shoppers discover useful viral products and click through to trusted product links.
          </p>
        </div>
      </div>
    </div>
  )
}
