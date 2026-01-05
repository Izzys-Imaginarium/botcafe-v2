import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { WellbeingDashboardView } from '@/modules/wellbeing/ui/views/wellbeing-dashboard-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Wellbeing Center | BotCafé',
  description: 'Track your mood, manage usage limits, and access mental health support resources.',
}

export default function WellbeingPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Wellbeing dashboard */}
      <div className="relative z-10 pt-24">
        <WellbeingDashboardView />
      </div>
    </>
  )
}
