import { SignIn } from '@clerk/nextjs'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'

export const dynamic = 'force-dynamic'

export default function SignInPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Main sign-in content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen pt-24">
        <div className="glass-rune p-8 rounded-xl border border-gold-ancient/30 bg-[#0a140a]/50 backdrop-blur-sm">
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary:
                  'bg-gold-ancient/20 hover:bg-gold-ancient/30 text-gold-rich border border-gold-ancient/30 font-lore',
                card: 'glass-rune border-none shadow-none',
                headerTitle: 'text-gold-rich font-display text-2xl',
                headerSubtitle: 'text-parchment-dim font-lore',
                socialButtonsBlockButton:
                  'border border-gold-ancient/30 text-parchment hover:bg-gold-ancient/20',
                socialButtonsBlockButtonText: 'text-parchment font-lore',
                formFieldInput:
                  'bg-[#0a140a]/50 border-gold-ancient/30 text-parchment focus:border-gold-rich',
                formFieldLabel: 'text-parchment font-lore',
                footerActionLink: 'text-gold-rich hover:text-glow-gold',
              },
            }}
          />
        </div>
      </div>
    </>
  )
}
