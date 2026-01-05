import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { MoodJournalView } from '@/modules/wellbeing/ui/views/mood-journal-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Mood Journal | BotCafé',
  description: 'Track your emotional wellbeing and identify mood patterns over time.',
}

export default function MoodJournalPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Mood journal */}
      <div className="relative z-10 pt-24">
        <MoodJournalView />
      </div>
    </>
  )
}
