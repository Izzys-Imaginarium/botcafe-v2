import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { LoreDashboard } from '@/modules/lore/ui/views/lore-dashboard'

export const dynamic = 'force-dynamic'

export default async function LorePage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Main lore page content */}
      <div className="relative z-10 pt-24">
        <LoreDashboard />
      </div>
    </>
  )
}
