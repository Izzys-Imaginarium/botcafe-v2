import React from 'react'
import { Inter, Cinzel_Decorative, Crimson_Text } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './styles.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

const cinzelDecorative = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cinzelDecorative.variable} ${crimsonText.variable} font-body antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
