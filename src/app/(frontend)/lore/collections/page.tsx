import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Redirect to unified lore page - tomes (collections) are now managed there
export default async function LoreCollectionsPage() {
  redirect('/lore')
}
