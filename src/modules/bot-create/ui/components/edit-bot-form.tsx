'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BotWizardForm, BotFormData } from './bot-wizard-form'
import { toast } from 'sonner'

interface EditBotFormProps {
  botId: string | number
}

export function EditBotForm({ botId }: EditBotFormProps) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [botData, setBotData] = useState<Partial<BotFormData> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [user, isLoaded, router])

  // Fetch existing bot data
  useEffect(() => {
    const fetchBot = async () => {
      if (!botId) return

      try {
        const response = await fetch(`/api/bots/${botId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch bot data')
        }

        const data = await response.json() as any

        // Transform the API response to match BotFormData structure
        setBotData({
          name: data.name || '',
          creator_display_name: data.creator_display_name || '',
          description: data.description || '',
          system_prompt: data.system_prompt || '',
          greeting: data.greeting || '',
          gender: data.gender || '',
          age: data.age?.toString() || '',
          is_public: data.is_public || false,
          slug: data.slug || '',
          speech_examples: data.speech_examples?.map((ex: { example: string }) => ex.example) || [''],
          knowledge_collections: data.knowledge_collections || [],
          picture: data.picture || null,
        })
      } catch (err: any) {
        console.error('Error fetching bot:', err)
        setError(err.message || 'Failed to load bot data')
        toast.error('Failed to load bot data')
      } finally {
        setIsLoading(false)
      }
    }

    if (isLoaded && user) {
      fetchBot()
    }
  }, [botId, isLoaded, user])

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-forest"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  if (error || !botData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-parchment-dim font-lore text-lg mb-4">
            {error || 'Failed to load bot data'}
          </p>
          <button
            onClick={() => router.push('/account')}
            className="text-gold-rich hover:text-glow-gold font-lore"
          >
            Return to Account
          </button>
        </div>
      </div>
    )
  }

  return (
    <BotWizardForm
      mode="edit"
      botId={botId}
      initialData={botData}
      onSuccess={(bot) => router.push(`/bot/${bot.slug || botData.slug}`)}
    />
  )
}
