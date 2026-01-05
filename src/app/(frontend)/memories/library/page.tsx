import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { MemoryLibraryView } from '@/modules/memories/ui/views/memory-library-view'

export const dynamic = 'force-dynamic'

export default async function MemoryLibraryPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Memory library page */}
      <div className="relative z-10 pt-24">
        <MemoryLibraryView />
      </div>
    </>
  )
}
