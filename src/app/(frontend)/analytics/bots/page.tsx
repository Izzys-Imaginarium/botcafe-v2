import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { BotAnalyticsView } from '@/modules/analytics/ui/views/bot-analytics-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Bot Analytics | BotCafe',
  description: 'Detailed performance metrics and statistics for your bots.',
}

export default function BotAnalyticsPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Bot analytics */}
      <div className="relative z-10 pt-24">
        <BotAnalyticsView />
      </div>
    </>
  )
}
