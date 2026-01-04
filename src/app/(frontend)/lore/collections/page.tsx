import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { LoreCollectionsView } from '@/modules/lore/ui/views/lore-collections-view'

export const dynamic = 'force-dynamic'

export default async function LoreCollectionsPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Lore collections page */}
      <div className="relative z-10 pt-24">
        <LoreCollectionsView />
      </div>
    </>
  )
}
