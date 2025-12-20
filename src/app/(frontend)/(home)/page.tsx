import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { SplashHero } from '@/modules/home/ui/components/splash-hero'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Hero section with splash page design */}
      <SplashHero user={user} />
    </>
  )
}
