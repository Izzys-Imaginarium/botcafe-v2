import { currentUser } from '@clerk/nextjs/server'
import { SplashHero } from '@/modules/home/ui/components/splash-hero'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const clerkUser = await currentUser()

  // Convert Clerk user to the format expected by SplashHero
  const user = clerkUser
    ? { email: clerkUser.emailAddresses[0]?.emailAddress || '' }
    : null

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Hero section with splash page design */}
      <SplashHero user={user} />
    </>
  )
}
