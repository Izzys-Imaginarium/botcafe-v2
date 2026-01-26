import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { LegalHubView } from '@/modules/legal/ui/views/legal-hub-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Legal & Policies | BotCafe',
  description: 'Terms of Service, Privacy Policy, and other legal documents for BotCafe platform.',
}

export default function LegalPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Legal hub page */}
      <div className="relative z-10 pt-24">
        <LegalHubView />
      </div>
    </>
  )
}
