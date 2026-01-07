import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Legacy bot edit URL format is no longer supported
// All bots now use the /<username>/<botSlug>/edit format
export default async function LegacyEditBotPage() {
  notFound()
}
