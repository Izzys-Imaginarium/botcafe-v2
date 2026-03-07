import { BackroomsExploreView } from '@/modules/backrooms/ui/views/backrooms-explore-view'

export const dynamic = 'force-dynamic'

export default async function BackroomsPage() {
  return (
    <div className="relative min-h-screen">
      {/* Subtle backstage ambience */}
      <div className="fixed inset-0 bg-gradient-to-b from-curtain-dark via-curtain to-curtain-dark opacity-50 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 pt-24">
        <BackroomsExploreView />
      </div>
    </div>
  )
}
