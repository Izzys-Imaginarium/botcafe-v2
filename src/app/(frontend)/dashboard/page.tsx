import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { ContentDashboard } from '@/modules/content/ui/views/content-dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Main dashboard content */}
      <div className="relative z-10 pt-24">
        <ContentDashboard />
      </div>
    </>
  )
}
