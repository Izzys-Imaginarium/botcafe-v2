'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { BotWizardForm } from './bot-wizard-form'

export function CreateBotForm() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [user, isLoaded, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-forest"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <BotWizardForm
      mode="create"
      onSuccess={(bot) => router.push('/explore')}
    />
  )
}
