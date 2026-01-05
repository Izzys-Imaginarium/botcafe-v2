import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { PersonaForm } from '@/modules/personas/ui/components/persona-form'

export const dynamic = 'force-dynamic'

interface EditPersonaPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPersonaPage({ params }: EditPersonaPageProps) {
  const { id } = await params
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Fetch persona data
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Find user in Payload
  const users = await payload.find({
    collection: 'users',
    where: {
      clerkUserId: {
        equals: user.id,
      },
    },
  })

  if (users.docs.length === 0) {
    redirect('/personas')
  }

  const payloadUser = users.docs[0]

  // Fetch persona
  let persona
  try {
    persona = await payload.findByID({
      collection: 'personas',
      id,
      depth: 2,
    })
  } catch (error) {
    redirect('/personas')
  }

  // Verify ownership
  if (typeof persona.user === 'object' && persona.user.id !== payloadUser.id) {
    redirect('/personas')
  }

  // Transform persona data for form
  const initialData = {
    name: persona.name,
    description: persona.description,
    personality_traits: persona.personality_traits || {},
    appearance: persona.appearance || {},
    behavior_settings: persona.behavior_settings || {},
    interaction_preferences: persona.interaction_preferences || {},
    is_default: persona.is_default || false,
    is_public: persona.is_public || false,
    tags: persona.tags || [],
    custom_instructions: persona.custom_instructions || '',
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Edit persona page */}
      <div className="relative z-10 pt-24">
        <PersonaForm mode="edit" personaId={id} initialData={initialData} />
      </div>
    </>
  )
}
