import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { CreatorEditForm } from '@/modules/creators/ui/components/creator-edit-form'

export const dynamic = 'force-dynamic'

interface CreatorEditPageProps {
  params: Promise<{ username: string }>
}

export default async function CreatorEditPage({ params }: CreatorEditPageProps) {
  const { username } = await params
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Creator edit form */}
      <div className="relative z-10 pt-24">
        <CreatorEditForm username={username} />
      </div>
    </>
  )
}
