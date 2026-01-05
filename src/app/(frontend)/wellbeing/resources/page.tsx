import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { CrisisSupportView } from '@/modules/wellbeing/ui/views/crisis-support-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Crisis Support Resources | BotCafé',
  description: 'Find mental health support resources, crisis hotlines, and professional help.',
}

export default function CrisisSupportPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Crisis support resources */}
      <div className="relative z-10 pt-24">
        <CrisisSupportView />
      </div>
    </>
  )
}
