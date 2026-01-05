import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { HelpArticleView } from '@/modules/help/ui/views/help-article-view'

export const dynamic = 'force-dynamic'

interface HelpArticlePageProps {
  params: Promise<{ slug: string }>
}

export default async function HelpArticlePage({ params }: HelpArticlePageProps) {
  const { slug } = await params

  return (
    <>
      {/* Magical background effects */}
      <MagicalBackground />

      {/* Help article page */}
      <div className="relative z-10 pt-24">
        <HelpArticleView slug={slug} />
      </div>
    </>
  )
}
