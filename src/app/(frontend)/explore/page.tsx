import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { BotExploreView } from '@/modules/explore/ui/views/bot-explore-view'

export const dynamic = 'force-dynamic'

export default async function ExplorePage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Main explore page content */}
      <div className="relative z-10 pt-24">
        <BotExploreView />
      </div>
    </>
  )
}
