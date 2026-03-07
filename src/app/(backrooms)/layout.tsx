import React from 'react'
import { Inter, Quintessential, Crimson_Text } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import { BackroomsNav } from '@/modules/backrooms/ui/components/backrooms-nav'
import './backrooms-styles.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

const quintessential = Quintessential({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
})

const crimsonText = Crimson_Text({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lore',
})

export const metadata = {
  description: 'The Backrooms - BotCafe\'s curated backstage showcase',
  title: 'The Backrooms | BotCafe',
  icons: {
    icon: '/favicon.svg',
  },
}

export default async function BackroomsLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${quintessential.variable} ${crimsonText.variable} font-body antialiased min-h-screen flex flex-col`}
        >
          <BackroomsNav />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-velvet-deep/30 py-6 text-center">
            <p className="text-cream-dim font-lore text-sm">
              The Backrooms &mdash; A BotCafe Production
            </p>
          </footer>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
