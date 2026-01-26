import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { UsageAnalyticsView } from '@/modules/analytics/ui/views/usage-analytics-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Usage Statistics | BotCafe',
  description: 'Track your platform usage, content breakdown, and engagement metrics.',
}

export default function UsageAnalyticsPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Usage analytics */}
      <div className="relative z-10 pt-24">
        <UsageAnalyticsView />
      </div>
    </>
  )
}
