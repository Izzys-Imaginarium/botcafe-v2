import { headers as getHeaders } from 'next/headers.js'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden selection:bg-accent selection:text-accent-foreground">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 bg-background">
        <div className="absolute inset-0 bg-vignette pointer-events-none"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-accent/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-secondary/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative flex items-center justify-center">
                <div className="absolute inset-0 border border-primary/50 rounded-full animate-[spin_12s_linear_infinite]"></div>
                <div className="absolute inset-1 border border-accent/50 rounded-full animate-[spin_8s_linear_infinite_reverse]"></div>
                <span className="text-primary text-xl">☕</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl text-foreground tracking-wider">
                  Bot<span className="text-primary">Café</span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Sanctuary
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6 px-6 py-2 bg-secondary/40 rounded-full border border-border/20">
              <a
                className="text-sm font-lore italic text-foreground hover:text-primary transition-colors"
                href="#"
              >
                Home
              </a>
              <a
                className="text-sm font-lore italic text-foreground hover:text-primary transition-colors"
                href="#"
              >
                Explore
              </a>
              <a
                className="text-sm font-lore italic text-foreground hover:text-primary transition-colors"
                href="#"
              >
                Create
              </a>
            </nav>

            <div className="flex items-center gap-4">
              {user ? (
                <span className="text-sm text-muted-foreground">{user.email}</span>
              ) : (
                <Button
                  variant="ghost"
                  className="font-display text-primary hover:text-foreground tracking-widest"
                >
                  LOGIN
                </Button>
              )}
              <Button asChild>
                <Link href="/admin">Admin</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 relative z-10 pt-32 min-h-screen">
        <div className="max-w-4xl w-full flex flex-col items-center">
          {/* Icon */}
          <div className="mb-8 relative group">
            <div className="absolute -inset-4 bg-accent/20 rounded-full blur-xl group-hover:bg-primary/20 transition-all duration-700"></div>
            <div className="w-24 h-24 glass-rune rounded-full flex items-center justify-center relative animate-float">
              <div className="absolute inset-2 border border-dashed border-border/40 rounded-full animate-[spin_20s_linear_infinite]"></div>
              <span className="text-4xl text-primary drop-shadow-lg">📚</span>
            </div>
          </div>

          {/* Title */}
          <span className="text-sm font-lore text-accent/60 tracking-[0.5em] uppercase opacity-70 mb-4">
            The Enchanted
          </span>
          <h1 className="font-display font-bold text-5xl sm:text-7xl md:text-8xl mb-6 text-transparent bg-clip-text bg-gradient-to-br from-primary via-foreground to-secondary tracking-tight drop-shadow-lg pb-4">
            BotCafé
          </h1>

          {/* Description */}
          <div className="relative max-w-2xl mx-auto mb-12 p-6">
            <span className="absolute top-0 left-0 text-4xl font-display text-border/30">
              &ldquo;
            </span>
            <span className="absolute bottom-0 right-0 text-4xl font-display text-border/30 rotate-180">
              &rdquo;
            </span>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-lore italic px-4">
              {user ? (
                <>
                  Welcome back, <span className="text-primary font-semibold">{user.email}</span>.
                  Your companions await.
                </>
              ) : (
                <>
                  Step into the liminal space between worlds. <br className="hidden md:block" />
                  <span className="text-primary font-semibold">Conjure companions</span> from the
                  ether and find cozy sanctuary.
                </>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 py-6 font-display font-bold text-lg tracking-wider"
            >
              ✨ Create Companion
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-8 py-6 font-display font-bold text-lg tracking-wider"
            >
              Explore →
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-3xl text-primary">100+</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs uppercase tracking-[0.2em] font-bold">
                  🧠 Spirits Bound
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-3xl text-primary">5k+</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs uppercase tracking-[0.2em] font-bold">
                  💬 Tales Told
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-3xl text-accent">Open</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs uppercase tracking-[0.2em] font-bold">
                  🚪 To All
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 text-center text-sm text-muted-foreground bg-background relative z-20">
        <div className="flex flex-col items-center justify-center gap-4">
          <span className="text-muted-foreground/30 text-2xl mb-2">📖</span>
          <span className="font-lore italic">© 2024 BotCafé. Inscribed in the Digital Ether.</span>
          <div className="flex gap-8 mt-2">
            <a
              className="text-xs hover:text-primary uppercase tracking-widest transition-colors font-display"
              href="#"
            >
              Entrance
            </a>
            <a
              className="text-xs hover:text-primary uppercase tracking-widest transition-colors font-display"
              href="#"
            >
              Scrolls
            </a>
            <a
              className="text-xs hover:text-primary uppercase tracking-widest transition-colors font-display"
              href="#"
            >
              Oaths
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
