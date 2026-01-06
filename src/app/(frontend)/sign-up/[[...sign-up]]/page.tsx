import { SignUp } from '@clerk/nextjs'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'

export const dynamic = 'force-dynamic'

export default function SignUpPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Main sign-up content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen pt-24">
        <div className="glass-rune p-8 rounded-xl border border-gold-ancient/30 bg-[#0a140a]/50 backdrop-blur-sm">
          <SignUp
            appearance={{
              elements: {
                rootBox: 'w-full',
                cardBox: 'shadow-none',
                card: 'bg-transparent border-none shadow-none',
                headerTitle: 'text-gold-rich font-display text-2xl',
                headerSubtitle: 'text-parchment-dim font-lore',
                socialButtonsBlockButton:
                  'border border-gold-ancient/30 text-parchment hover:bg-gold-ancient/20 bg-[#0a140a]/50',
                socialButtonsBlockButtonText: 'text-parchment font-lore',
                dividerLine: 'bg-gold-ancient/30',
                dividerText: 'text-parchment-dim font-lore',
                formFieldLabel: 'text-parchment font-lore',
                formFieldInput:
                  'bg-[#0a140a]/80 border-gold-ancient/30 text-parchment focus:border-gold-rich placeholder:text-parchment-dim/50',
                formFieldInputShowPasswordButton: 'text-parchment hover:text-gold-rich',
                formButtonPrimary:
                  'bg-gold-rich/80 hover:bg-gold-rich text-[#0a140a] font-lore font-semibold',
                footerActionText: 'text-parchment-dim font-lore',
                footerActionLink: 'text-gold-rich hover:text-gold-rich/80 font-lore',
                identityPreviewText: 'text-parchment',
                identityPreviewEditButton: 'text-gold-rich hover:text-gold-rich/80',
                formFieldAction: 'text-gold-rich hover:text-gold-rich/80 font-lore',
                formFieldErrorText: 'text-red-400',
                alert: 'bg-red-900/20 border-red-400/30 text-red-300',
                alertText: 'text-red-300',
              },
            }}
          />
        </div>
      </div>
    </>
  )
}
