export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Track Your Order</h1>
        <p className="mb-8 text-gray-500">Enter your order number and email to check your order status.</p>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <form className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Order Number</label>
              <input
                type="text"
                placeholder="#1001"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                placeholder="you@email.com"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button type="submit" className="w-full rounded-full bg-gray-900 py-3 text-sm font-bold text-white hover:bg-gray-800">
              Track Order
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-xl bg-sky-50 border border-sky-100 px-5 py-4">
          <p className="text-sm font-semibold text-sky-800">All orders include tracking</p>
          <p className="mt-1 text-xs text-sky-600">
            Tracking numbers are uploaded within 24 hours of order placement. You will receive an email when your order ships.
          </p>
        </div>
      </div>
    </div>
  )
}
