'use client'

import { Button } from '@/components/ui/button'
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface SplashHeroProps {
  user?: { email: string } | null
}

export const SplashHero = ({ user }: SplashHeroProps) => {
  return (
    <main className="flex-grow flex flex-col items-center justify-center text-center px-4 relative z-10 pt-32 sm:pt-24 min-h-screen">
      {/* Background decorative elements */}
      <div className="absolute top-[20%] left-[5%] w-px h-64 bg-gradient-to-b from-transparent via-gold-ancient/40 to-transparent hidden xl:block"></div>
      <div className="absolute top-[20%] right-[5%] w-px h-64 bg-gradient-to-b from-transparent via-gold-ancient/40 to-transparent hidden xl:block"></div>

      <div className="max-w-5xl w-full flex flex-col items-center justify-center relative mt-4 md:mt-0">
        {/* Floating icon */}
        <div className="mb-6 sm:mb-10 relative group">
          <div className="absolute -inset-4 bg-forest/20 rounded-full blur-xl group-hover:bg-gold-rich/20 transition-all duration-700"></div>
          <div className="w-24 h-24 sm:w-32 sm:h-32 glass-rune rounded-full flex items-center justify-center relative animate-float">
            <div className="absolute inset-2 border border-dashed border-gold-ancient/40 rounded-full animate-[spin_20s_linear_infinite]"></div>
            <BookOpen className="w-10 h-10 sm:w-16 sm:h-16 text-gold-rich drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
            <div className="absolute -top-2 -right-2 w-2 h-2 bg-gold-rich rounded-full animate-twinkle"></div>
            <div
              className="absolute bottom-4 -left-3 w-1.5 h-1.5 bg-magic-glow rounded-full animate-twinkle"
              style={{ animationDelay: '1s' }}
            ></div>
          </div>
        </div>

        {/* Subtitle */}
        <span className="text-xs sm:text-lg font-lore text-magic-glow/60 tracking-[0.3em] sm:tracking-[0.5em] uppercase opacity-70 mb-4 sm:mb-4 px-4 text-center block w-full">
          The Enchanted
        </span>

        {/* Main title */}
        <h1 className="font-display font-bold text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] 2xl:text-[12rem] mb-8 text-transparent bg-clip-text bg-gradient-to-br from-gold-rich via-parchment to-gold-ancient tracking-normal drop-shadow-lg pb-12 px-12 md:px-16 relative leading-[1.1] sm:leading-tight overflow-visible">
          BotCafé
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-gold-rich/50 to-transparent"></div>
        </h1>

        {/* Description */}
        <div className="relative max-w-2xl mx-auto mb-12 sm:mb-16 p-6">
          <span className="absolute top-0 left-0 text-4xl sm:text-6xl font-display text-gold-ancient/10">
            "
          </span>
          <span className="absolute bottom-0 right-0 text-4xl sm:text-6xl font-display text-gold-ancient/10 rotate-180">
            "
          </span>
          <p className="text-lg sm:text-xl md:text-2xl text-parchment-dim leading-relaxed font-lore italic px-4">
            {user ? (
              <>
                Welcome back, <span className="text-gold-rich font-semibold">{user.email}</span>.
                Your companions await.
              </>
            ) : (
              <>
                Step into the liminal space between worlds. <br className="hidden md:block" />
                <span className="text-gold-rich font-semibold">Conjure companions</span> from the
                ether, share ancient tales, and find cozy sanctuary in the library of dreams.
              </>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-xs sm:max-w-none px-4 sm:px-0">
          <Button
            className="ornate-border w-full sm:w-auto px-10 py-5 bg-gradient-to-b from-[#2d4a2d] to-[#1a2f1a] text-parchment font-display font-bold text-lg tracking-wider rounded-sm shadow-[0_10px_40px_-10px_rgba(77,124,15,0.5)] hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.3)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
            asChild
          >
            <Link href="/create">
              <Sparkles className="w-5 h-5 text-gold-rich" />
              Create Companion
            </Link>
          </Button>

          <Button
            className="group w-full sm:w-auto px-10 py-5 bg-transparent border border-gold-ancient/40 text-gold-rich font-display font-bold text-lg tracking-wider rounded-sm hover:bg-gold-ancient/10 transition-all flex items-center justify-center gap-3 backdrop-blur-sm relative overflow-hidden"
            asChild
            variant="outline"
          >
            <Link href="/explore">
              <span>Build Your World</span>
              <ArrowRight className="opacity-70 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Stats Section */}
        <div className="mt-16 sm:mt-24 flex flex-wrap items-center justify-center gap-x-16 gap-y-10 border-t border-gold-ancient/20 pt-10 px-10 bg-gradient-to-b from-forest-deep/30 to-transparent rounded-t-3xl backdrop-blur-sm">
          <div className="text-center group w-full sm:w-auto">
            <div className="font-display font-bold text-4xl text-gold-rich group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
              100+
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-parchment-dim uppercase tracking-[0.2em] mt-2 font-bold">
              <span className="material-symbols-outlined text-[14px]">psychology</span>
              Spirits Bound
            </div>
          </div>

          <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-transparent via-gold-ancient/40 to-transparent"></div>

          <div className="text-center group w-full sm:w-auto">
            <div className="font-display font-bold text-4xl text-gold-rich group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
              5k+
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-parchment-dim uppercase tracking-[0.2em] mt-2 font-bold">
              <span className="material-symbols-outlined text-[14px]">forum</span>
              Tales Told
            </div>
          </div>

          <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-transparent via-gold-ancient/40 to-transparent"></div>

          <div className="text-center group w-full sm:w-auto">
            <div className="font-display font-bold text-4xl text-magic-teal group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">
              Open
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-parchment-dim uppercase tracking-[0.2em] mt-2 font-bold">
              <span className="material-symbols-outlined text-[14px]">gate</span>
              To All
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
