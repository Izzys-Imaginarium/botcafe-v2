import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <>
      {/* Background effects */}
      <div className="fixed inset-0 z-0 bg-background">
        <div className="absolute inset-0 bg-vignette pointer-events-none"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-accent/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-secondary/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 relative z-10 min-h-[calc(100vh-12rem)]">
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
                <CardTitle className="font-display text-3xl accent">Open</CardTitle>
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
    </>
  )
}
