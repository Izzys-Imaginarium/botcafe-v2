import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { AnalyticsDashboardView } from '@/modules/analytics/ui/views/analytics-dashboard-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Analytics Dashboard | BotCafé',
  description: 'Track your bot performance, usage statistics, and engagement metrics.',
}

export default function AnalyticsPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Analytics dashboard */}
      <div className="relative z-10 pt-24">
        <AnalyticsDashboardView />
      </div>
    </>
  )
}
