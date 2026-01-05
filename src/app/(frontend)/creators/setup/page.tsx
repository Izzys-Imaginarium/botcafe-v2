import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { CreatorSetupForm } from '@/modules/creators/ui/components/creator-setup-form'

export const dynamic = 'force-dynamic'

export default async function CreatorSetupPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Check if user already has a creator profile
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

  if (users.docs.length > 0) {
    const payloadUser = users.docs[0]

    // Check for existing creator profile
    const existingProfile = await payload.find({
      collection: 'creatorProfiles',
      where: {
        user: {
          equals: payloadUser.id,
        },
      },
    })

    if (existingProfile.docs.length > 0) {
      // Already has a profile, redirect to it
      redirect(`/creators/${existingProfile.docs[0].username}`)
    }
  }

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Creator setup page */}
      <div className="relative z-10 pt-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Become a Creator
            </h1>
            <p className="text-muted-foreground">
              Set up your creator profile and start showcasing your bots
            </p>
          </div>
        </div>
        <CreatorSetupForm />
      </div>
    </>
  )
}
