import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { SelfModerationSettingsView } from '@/modules/wellbeing/ui/views/self-moderation-settings-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Self-Moderation Settings | BotCafé',
  description: 'Configure your wellbeing preferences, usage limits, and healthy habit reminders.',
}

export default function SelfModerationSettingsPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Self-moderation settings */}
      <div className="relative z-10 pt-24">
        <SelfModerationSettingsView />
      </div>
    </>
  )
}
