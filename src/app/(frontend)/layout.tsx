import React from 'react'
import { Inter, Quintessential, Crimson_Text } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
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
  description: 'BotCafé - The Enchanted Sanctuary for AI Companions',
  title: 'BotCafé',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${quintessential.variable} ${crimsonText.variable} font-body antialiased`}
        >
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
