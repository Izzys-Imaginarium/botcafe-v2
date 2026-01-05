import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { CreatorDirectoryView } from '@/modules/creators/ui/views/creator-directory-view'

export const dynamic = 'force-dynamic'

export default async function CreatorsPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Creators directory page */}
      <div className="relative z-10 pt-24">
        <CreatorDirectoryView />
      </div>
    </>
  )
}
