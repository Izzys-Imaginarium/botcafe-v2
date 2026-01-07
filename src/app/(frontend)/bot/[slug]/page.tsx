import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Legacy bot URL format is no longer supported
// All bots now use the /<username>/<botSlug> format
export default async function LegacyBotDetailPage() {
  notFound()
}
