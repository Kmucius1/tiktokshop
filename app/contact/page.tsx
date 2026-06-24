import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="mb-6 inline-block text-sm text-sky-600 hover:underline">← Back to home</Link>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Contact Us</h1>
        <p className="mb-8 text-gray-500">We typically respond within 1–2 business days.</p>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input type="text" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input type="email" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Order Number (optional)</label>
              <input type="text" placeholder="#1001" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
              <textarea rows={4} className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <button type="submit" className="w-full rounded-full bg-gray-900 py-3 text-sm font-bold text-white hover:bg-gray-800">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
