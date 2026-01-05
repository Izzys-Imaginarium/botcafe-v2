import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { PersonaForm } from '@/modules/personas/ui/components/persona-form'

export const dynamic = 'force-dynamic'

export default async function CreatePersonaPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Create persona page */}
      <div className="relative z-10 pt-24">
        <PersonaForm mode="create" />
      </div>
    </>
  )
}
