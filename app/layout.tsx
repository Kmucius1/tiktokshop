import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthHashHandler } from '@/components/AuthHashHandler'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiktokshop.art'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TikTokShop.art Finds — Viral finds from across the internet',
    template: '%s | TikTokShop.art Finds',
  },
  description: 'Curated Amazon affiliate products that are actually worth buying.',
  openGraph: {
    siteName: 'TikTokShop.art Finds',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <AuthHashHandler />
        {children}
      </body>
    </html>
  )
}
