import React from 'react'
import { Inter, Quintessential, Crimson_Text } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import { Navbar } from '@/modules/home/ui/components/navbar'
import { Footer } from '@/modules/home/ui/components/footer'
import './styles.css'

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
  description: 'BotCafe - The Enchanted Sanctuary for AI Companions',
  title: 'BotCafe',
  icons: {
    icon: '/favicon.svg',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${quintessential.variable} ${crimsonText.variable} font-body antialiased min-h-screen flex flex-col`}
        >
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
