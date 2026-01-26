import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Mood Journal | BotCafe',
  description: 'Track your emotional wellbeing with the mood journal',
}

export default function MoodPage() {
  redirect('/account?tab=mood')
}
