import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { HelpHubView } from '@/modules/help/ui/views/help-hub-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Help Center | BotCafe',
  description: 'Find guides, tutorials, and answers to help you get the most out of BotCafe.',
}

export default function HelpPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Help hub page */}
      <div className="relative z-10 pt-24">
        <HelpHubView />
      </div>
    </>
  )
}
