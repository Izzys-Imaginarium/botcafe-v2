import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { LegalDocumentView } from '@/modules/legal/ui/views/legal-document-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Terms of Service | BotCafé',
  description: 'Terms of Service for using the BotCafé platform.',
}

export default function TermsPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Terms of Service page */}
      <div className="relative z-10 pt-24">
        <LegalDocumentView
          documentType="terms-of-service"
          title="Terms of Service"
        />
      </div>
    </>
  )
}
