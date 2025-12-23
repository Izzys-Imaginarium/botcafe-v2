import '../styles.css'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { Navbar, Footer } from '@/modules/home/ui/components'

export default async function ExploreLayout({ children }: { children: React.ReactNode }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} />
      <div className="flex-1 pt-20">{children}</div>
      <Footer />
    </div>
  )
}
