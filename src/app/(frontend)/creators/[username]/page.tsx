import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { CreatorProfileView } from '@/modules/creators/ui/views/creator-profile-view'

export const dynamic = 'force-dynamic'

interface CreatorProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function CreatorProfilePage({ params }: CreatorProfilePageProps) {
  const { username } = await params
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Creator profile page */}
      <div className="relative z-10 pt-24">
        <CreatorProfileView username={username} />
      </div>
    </>
  )
}
