import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Analytics | BotCafé',
  description: 'Track your bot performance, usage statistics, and engagement metrics.',
}

export default function AnalyticsPage() {
  // Analytics is now integrated into the Account page Overview tab
  redirect('/account?tab=overview')
}
