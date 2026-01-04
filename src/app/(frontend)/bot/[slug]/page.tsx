import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { BotDetailView } from '@/modules/bot-detail/ui/components/bot-detail-view'

export const dynamic = 'force-dynamic'

export default async function BotDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Bot detail content */}
      <div className="relative z-10">
        <BotDetailView slug={slug} />
      </div>
    </>
  )
}
