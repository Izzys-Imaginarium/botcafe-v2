import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { PersonaLibraryView } from '@/modules/personas/ui/views/persona-library-view'

export const dynamic = 'force-dynamic'

export default async function PersonasPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Personas page */}
      <div className="relative z-10 pt-24">
        <PersonaLibraryView />
      </div>
    </>
  )
}
