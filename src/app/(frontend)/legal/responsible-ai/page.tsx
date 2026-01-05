import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { LegalDocumentView } from '@/modules/legal/ui/views/legal-document-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Responsible AI Use | BotCafé',
  description: 'Guidelines for ethical and responsible use of AI services on BotCafé.',
}

export default function ResponsibleAIPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Responsible AI page */}
      <div className="relative z-10 pt-24">
        <LegalDocumentView
          documentType="acceptable-use-policy"
          title="Responsible AI Use"
        />
      </div>
    </>
  )
}
