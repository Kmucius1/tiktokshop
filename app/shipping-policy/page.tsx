import Link from 'next/link'

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-block text-sm text-sky-600 hover:underline">← Back to home</Link>
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Shipping Policy</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
          <section>
            <h2 className="text-lg font-semibold text-gray-800">Honest Shipping Estimates</h2>
            <p>We only display delivery estimates on products that have been verified with a confirmed supplier, a real tracking carrier, and a known warehouse location. If no estimate is shown, it means we are still verifying that product&apos;s shipping chain.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800">Processing Time</h2>
            <p>Orders are sent to our supplier partners within 1 business day of payment confirmation. Processing and handling times vary by product and are shown on the product page where available.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800">Tracking</h2>
            <p>All orders include a tracking number from a verified carrier (USPS, UPS, FedEx, DHL, OnTrac, or similar). Tracking numbers are uploaded within 24 hours of your order being handed to the carrier.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800">Shipping Carriers</h2>
            <p>We ship through verified carriers only. The carrier for your order depends on the product and supplier warehouse location. US warehouse products ship via USPS, UPS, FedEx, or DHL in most cases.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800">International Shipping</h2>
            <p>Currently, we ship within the United States only. International shipping is not available at this time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800">Questions?</h2>
            <p>Contact us at <Link href="/contact" className="text-sky-600 hover:underline">our contact page</Link> with your order number and we will help.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
