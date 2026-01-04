import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { EditBotForm } from '@/modules/bot-create/ui/components/edit-bot-form'

export const dynamic = 'force-dynamic'

export default async function EditBotPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Bot edit form */}
      <div className="relative z-10">
        <EditBotForm slug={slug} />
      </div>
    </>
  )
}
