import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Wellbeing | BotCafé',
  description: 'Track your mood, manage usage limits, and access mental health support resources.',
}

export default function WellbeingPage() {
  // Wellbeing is now integrated into the Account page
  redirect('/account?tab=wellbeing')
}
