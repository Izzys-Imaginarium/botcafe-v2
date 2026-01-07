import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { EditBotForm } from '@/modules/bot-create/ui/components/edit-bot-form'

export const dynamic = 'force-dynamic'

export default async function EditBotPage({
  params,
}: {
  params: Promise<{ username: string; botSlug: string }>
}) {
  const { username, botSlug } = await params

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Bot edit form */}
      <div className="relative z-10">
        <EditBotForm username={username} botSlug={botSlug} />
      </div>
    </>
  )
}
