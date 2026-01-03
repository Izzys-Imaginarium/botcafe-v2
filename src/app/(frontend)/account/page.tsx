import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { AccountDashboard } from '@/modules/account/ui/views/account-dashboard'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Main account page content */}
      <div className="relative z-10 pt-24">
        <AccountDashboard />
      </div>
    </>
  )
}
