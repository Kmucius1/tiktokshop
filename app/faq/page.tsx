import Link from 'next/link'

const FAQS = [
  {
    q: 'How fast will my order arrive?',
    a: 'Delivery estimates are shown on each product page for products with verified shipping. We never show fake delivery promises. Estimates are based on actual supplier handling time plus carrier transit time.',
  },
  {
    q: 'Does my order include tracking?',
    a: 'Yes. Every order includes tracking via a verified carrier such as USPS, UPS, FedEx, or DHL. You will receive a tracking number via email when your order ships.',
  },
  {
    q: 'Can I return my order?',
    a: 'Yes. Most items can be returned within 30 days of delivery in unused condition. See our Returns Policy for full details.',
  },
  {
    q: 'Where do your products ship from?',
    a: 'We ship from verified supplier warehouses. Most of our approved products ship from US-based warehouses. Warehouse location is shown where available.',
  },
  {
    q: 'How do I track my order?',
    a: 'Use the Track Order page and enter your order number and email address.',
  },
  {
    q: 'Why does some product pages not show a delivery estimate?',
    a: 'We only show delivery estimates on products that have been fully verified — meaning the supplier, carrier, and shipping times have all been confirmed. Products without an estimate are still being verified.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Currently we ship within the United States only.',
  },
  {
    q: 'How do I contact you?',
    a: 'Use our Contact page. We typically respond within 1–2 business days.',
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-block text-sm text-sky-600 hover:underline">← Back to home</Link>
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
        <div className="space-y-4">
          {FAQS.map(faq => (
            <details key={faq.q} className="group rounded-xl border border-gray-100 bg-gray-50 open:border-gray-200 open:bg-white">
              <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-gray-800 list-none flex items-center justify-between">
                {faq.q}
                <span className="ml-2 text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="px-5 pb-5 text-sm text-gray-600">{faq.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 rounded-xl bg-sky-50 border border-sky-100 p-6">
          <p className="text-sm font-semibold text-sky-800">Still have questions?</p>
          <p className="mt-1 text-sm text-sky-600">
            <Link href="/contact" className="underline hover:no-underline">Contact us</Link> and we will get back to you within 1–2 business days.
          </p>
        </div>
      </div>
    </div>
  )
}
