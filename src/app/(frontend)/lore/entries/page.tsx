import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { LoreEntriesView } from '@/modules/lore/ui/views/lore-entries-view'

export const dynamic = 'force-dynamic'

export default async function LoreEntriesPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Lore entries page */}
      <div className="relative z-10 pt-24">
        <LoreEntriesView />
      </div>
    </>
  )
}
