import Link from 'next/link'

export default function ReturnsPolicyPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-block text-sm text-sky-600 hover:underline">← Back to home</Link>
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Returns Policy</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
          <section>
            <h2 className="text-lg font-semibold text-gray-800">30-Day Returns</h2>
            <p>We accept returns on most items within 30 days of delivery. Items must be unused, in original packaging, and in the same condition you received them.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800">How to Request a Return</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>Contact us through the <Link href="/contact" className="text-sky-600 hover:underline">Contact page</Link> with your order number</li>
              <li>Tell us the reason for your return</li>
              <li>We will provide return instructions within 2 business days</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800">Refunds</h2>
            <p>Once your return is received and inspected, your refund will be processed to your original payment method within 5–7 business days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800">Non-Returnable Items</h2>
            <p>The following items cannot be returned: opened personal care items, items marked final sale, or items damaged by misuse.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800">Damaged or Wrong Items</h2>
            <p>If you received a damaged or incorrect item, contact us immediately. We will make it right at no cost to you.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
