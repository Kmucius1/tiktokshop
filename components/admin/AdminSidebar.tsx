'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingBag,
  AlertTriangle,
  RefreshCw,
  Video,
  Settings,
  FlaskConical,
  LogOut,
  MousePointerClick,
  FileBarChart,
  ShoppingCart,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/research', label: 'Research Queue', icon: FlaskConical },
  { href: '/admin/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/exceptions', label: 'Exceptions', icon: AlertTriangle },
  { href: '/admin/sync', label: 'Sync Logs', icon: RefreshCw },
  { href: '/admin/content', label: 'Content Angles', icon: Video },
  { href: '/admin/amazon-products/review', label: 'Amazon Products', icon: ShoppingCart },
  { href: '/admin/affiliate-analytics', label: 'Affiliate Clicks', icon: MousePointerClick },
  { href: '/admin/amazon-reports', label: 'Amazon Reports', icon: FileBarChart },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-gray-950 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-800 px-5 py-4">
        <span className="text-lg font-bold tracking-tight text-white">ViralVault</span>
        <span className="rounded bg-violet-500 px-1.5 py-0.5 text-xs font-semibold text-white">OS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {nav.map(item => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="border-t border-gray-800 px-3 py-4">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
