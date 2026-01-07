import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { BotDetailView } from '@/modules/bot-detail/ui/components/bot-detail-view'

export const dynamic = 'force-dynamic'

export default async function BotDetailPage({
  params,
}: {
  params: Promise<{ username: string; botSlug: string }>
}) {
  const { username, botSlug } = await params

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Bot detail content */}
      <div className="relative z-10">
        <BotDetailView username={username} botSlug={botSlug} />
      </div>
    </>
  )
}
