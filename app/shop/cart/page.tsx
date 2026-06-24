import Link from 'next/link'

export default function CartPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Your Cart</h1>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-4xl mb-4">🛒</p>
          <p className="text-lg font-semibold text-gray-700">Your cart is empty</p>
          <p className="mt-2 text-sm text-gray-400">Add some summer finds to get started.</p>
          <Link href="/shop" className="mt-6 inline-block rounded-full bg-sky-600 px-8 py-3 text-sm font-bold text-white hover:bg-sky-500">
            Shop Summer Finds
          </Link>
        </div>

        <div className="mt-6 rounded-xl bg-sky-50 border border-sky-100 px-5 py-4">
          <p className="text-sm text-sky-700">
            Checkout is handled through Shopify for secure payment processing. You will be redirected to complete your order.
          </p>
        </div>
      </div>
    </div>
  )
}
