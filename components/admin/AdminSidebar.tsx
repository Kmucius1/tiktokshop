'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard, Package, Upload, Hammer,
  Video, Download, BookOpen, RefreshCw,
  Settings, LogOut, Layers, ShoppingBag,
  AlertTriangle, MousePointerClick,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const nav = [
  {
    section: 'Main',
    items: [
      { href: '/admin',                    label: 'Dashboard',       icon: LayoutDashboard, exact: true },
      { href: '/admin/product-workroom',   label: 'Workroom',        icon: Hammer },
    ],
  },
  {
    section: 'Products',
    items: [
      { href: '/admin/products',           label: 'All Products',    icon: Package },
      { href: '/admin/products/import',    label: 'Import CSV/XLSX', icon: Upload },
    ],
  },
  {
    section: 'TikTok Shop',
    items: [
      { href: '/admin/tiktok/export',             label: 'Export to TikTok',  icon: Download },
      { href: '/admin/tiktok/seller-center-guide',label: 'Upload Guide',      icon: BookOpen },
      { href: '/admin/content-queue',             label: 'Content Queue',     icon: Video },
    ],
  },
  {
    section: 'Operations',
    items: [
      { href: '/admin/orders',             label: 'Orders',          icon: ShoppingBag },
      { href: '/admin/sync',               label: 'Sync Logs',       icon: RefreshCw },
      { href: '/admin/exceptions',         label: 'Exceptions',      icon: AlertTriangle },
      { href: '/admin/affiliate-analytics',label: 'Affiliate Clicks',icon: MousePointerClick },
    ],
  },
  {
    section: 'Settings',
    items: [
      { href: '/admin/settings',           label: 'General',         icon: Settings },
      { href: '/admin/settings/tiktok-shop',label: 'TikTok Shop API',icon: Layers },
      { href: '/admin/settings/autods',    label: 'AutoDS',          icon: RefreshCw },
    ],
  },
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
    <aside className="flex h-screen w-56 flex-col border-r border-gray-800 bg-gray-950 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-800 px-5 py-4">
        <span className="text-base font-extrabold tracking-tight text-white">TikTokShop.art</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {nav.map(group => (
          <div key={group.section} className="mb-4">
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-600">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t border-gray-800 px-3 py-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
