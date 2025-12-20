'use client'

import Link from 'next/link'
import { Menu, BookOpen } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="border-t border-gold-ancient/20 py-8 text-center text-sm text-gold-ancient/60 bg-[#050a05] relative z-20">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Menu className="text-gold-ancient/30 text-2xl mb-2" />
          <div className="absolute inset-0 animate-pulse">
            <BookOpen className="text-gold-ancient/30 text-2xl" />
          </div>
        </div>
        <span className="font-lore italic text-base">
          © 2025 BotCafé. Inscribed in the Digital Ether.
        </span>
        <div className="flex gap-8 mt-2">
          <Link
            href="#"
            className="text-xs hover:text-gold-rich uppercase tracking-widest transition-colors font-display"
          >
            Entrance
          </Link>
          <Link
            href="#"
            className="text-xs hover:text-gold-rich uppercase tracking-widest transition-colors font-display"
          >
            Scrolls
          </Link>
          <Link
            href="#"
            className="text-xs hover:text-gold-rich uppercase tracking-widest transition-colors font-display"
          >
            Oaths
          </Link>
        </div>
      </div>
    </footer>
  )
}
