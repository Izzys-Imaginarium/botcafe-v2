import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { MemoryImportView } from '@/modules/memories/ui/views/memory-import-view'

export const dynamic = 'force-dynamic'

export default async function MemoryImportPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Memory import page */}
      <div className="relative z-10 pt-24">
        <MemoryImportView />
      </div>
    </>
  )
}
