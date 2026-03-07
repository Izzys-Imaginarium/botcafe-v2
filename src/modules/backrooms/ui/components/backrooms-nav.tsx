'use client'

import Link from 'next/link'
import { UserButton, useAuth } from '@clerk/nextjs'
import { ArrowLeft } from 'lucide-react'

export const BackroomsNav = () => {
  const { isSignedIn } = useAuth()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-velvet-deep/30 bg-curtain-dark/90 backdrop-blur-md">
      <div className="px-4 lg:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-cream-dim hover:text-cream transition-colors text-sm font-lore"
          >
            <ArrowLeft className="h-4 w-4" />
            Main Stage
          </Link>
          <div className="h-6 w-px bg-velvet-deep/30" />
          <h1 className="font-display text-xl text-velvet text-glow-velvet">
            The Backrooms
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {isSignedIn && <UserButton afterSignOutUrl="/" />}
        </div>
      </div>
    </nav>
  )
}
