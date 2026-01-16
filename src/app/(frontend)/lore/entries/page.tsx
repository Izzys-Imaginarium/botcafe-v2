import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Redirect to unified lore page - entries are now managed within tomes
export default async function LoreEntriesPage() {
  redirect('/lore')
}
