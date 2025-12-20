import React from 'react'
import './styles.css'

export const metadata = {
  description: 'BotCafé - The Enchanted Sanctuary for AI Companions',
  title: 'BotCafé',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body className="font-body antialiased">
        <main>{children}</main>
      </body>
    </html>
  )
}
