'use client'

import Link from 'next/link'
import { Coffee, BookOpen } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="border-t border-gold-ancient/20 py-12 text-sm text-gold-ancient/60 bg-[#050a05] relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Coffee className="h-6 w-6 text-gold-rich" />
              <span className="font-display text-lg text-parchment">
                Bot<span className="text-gold-rich">Cafe</span>
              </span>
            </div>
            <p className="font-lore italic text-sm text-gold-ancient/50">
              The Enchanted Sanctuary for AI Companions
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-display text-xs uppercase tracking-widest text-parchment-dim mb-4">
              Explore
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/explore" className="hover:text-gold-rich transition-colors">
                  Browse Bots
                </Link>
              </li>
              <li>
                <Link href="/creators" className="hover:text-gold-rich transition-colors">
                  Creators
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-gold-rich transition-colors">
                  Create a Bot
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display text-xs uppercase tracking-widest text-parchment-dim mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="hover:text-gold-rich transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/wellbeing/resources" className="hover:text-gold-rich transition-colors">
                  Crisis Support
                </Link>
              </li>
              <li>
                <Link href="/legal/responsible-ai" className="hover:text-gold-rich transition-colors">
                  Responsible AI
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display text-xs uppercase tracking-widest text-parchment-dim mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/legal/terms" className="hover:text-gold-rich transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-gold-rich transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal" className="hover:text-gold-rich transition-colors">
                  All Legal Docs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gold-ancient/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gold-ancient/40" />
            <span className="font-lore italic">
              © 2025 BotCafe. Inscribed in the Digital Ether.
            </span>
          </div>
          <div className="flex gap-6">
            <Link
              href="https://discord.gg/botcafe"
              className="hover:text-gold-rich transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discord
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
