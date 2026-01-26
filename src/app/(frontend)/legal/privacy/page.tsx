import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { LegalDocumentView } from '@/modules/legal/ui/views/legal-document-view'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Privacy Policy | BotCafe',
  description: 'Privacy Policy explaining how BotCafe collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Privacy Policy page */}
      <div className="relative z-10 pt-24">
        <LegalDocumentView
          documentType="privacy-policy"
          title="Privacy Policy"
        />
      </div>
    </>
  )
}
