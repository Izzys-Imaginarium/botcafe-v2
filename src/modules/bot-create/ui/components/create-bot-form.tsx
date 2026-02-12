'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Bot, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'
import { BotWizardForm } from './bot-wizard-form'
import { ImportCardDialog } from './import-card-dialog'
import type { BotFormData } from './bot-wizard-form'
import type { CharacterBook } from '@/lib/tavern-card'

export function CreateBotForm() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [mode, setMode] = useState<'choose' | 'create' | 'import'>('choose')
  const [importedData, setImportedData] = useState<Partial<BotFormData> | null>(null)
  const [importedPictureUrl, setImportedPictureUrl] = useState<string | null>(null)
  const [importedPictureId, setImportedPictureId] = useState<string | number | null>(null)
  const [pendingCharacterBook, setPendingCharacterBook] = useState<CharacterBook | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [user, isLoaded, router])

  const handleImport = useCallback(
    (data: {
      formData: Partial<BotFormData>
      pictureId?: string | number
      pictureUrl?: string
      characterBook?: CharacterBook | null
    }) => {
      setImportedData(data.formData)
      setImportedPictureUrl(data.pictureUrl || null)
      setImportedPictureId(data.pictureId || null)
      setPendingCharacterBook(data.characterBook || null)
      setMode('import')
    },
    [],
  )

  const handleSuccess = useCallback(
    async (result: { id?: string | number; url?: string; slug?: string; username?: string }) => {
      // If there's a pending character book, import it
      if (pendingCharacterBook && result.id) {
        try {
          const loreResponse = await fetch(`/api/bots/${result.id}/import-lore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ characterBook: pendingCharacterBook }),
          })

          if (loreResponse.ok) {
            const loreResult = (await loreResponse.json()) as { entryCount: number; collectionName: string }
            toast.success(`Imported ${loreResult.entryCount} lore entries as "${loreResult.collectionName}"`)
          } else {
            toast.error('Bot created, but failed to import lore entries. You can add them manually.')
          }
        } catch {
          toast.error('Bot created, but failed to import lore entries.')
        }
      }

      // Navigate to the bot page
      if (result.url) {
        router.push(result.url)
      } else if (result.username && result.slug) {
        router.push(`/${result.username}/${result.slug}`)
      } else {
        router.push('/explore')
      }
    },
    [pendingCharacterBook, router],
  )

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

  // Show the wizard if user chose create from scratch or imported data
  if (mode === 'create') {
    return (
      <BotWizardForm
        mode="create"
        onSuccess={handleSuccess}
      />
    )
  }

  if (mode === 'import' && importedData) {
    return (
      <BotWizardForm
        mode="create"
        initialData={{
          ...importedData,
          picture: importedPictureId || importedData.picture || null,
        }}
        initialPictureUrl={importedPictureUrl}
        onSuccess={handleSuccess}
      />
    )
  }

  // Choice screen: Create from scratch or Import
  return (
    <>
      <MagicalBackground />
      <div className="relative z-10 min-h-screen bg-background/50 py-8 pt-32">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gold-rich mb-2 font-display">
              Create Your Bot
            </h1>
            <p className="text-muted-foreground">
              Start from scratch or import an existing character card
            </p>
          </div>

          <div className="grid gap-4">
            {/* Create from Scratch */}
            <div
              onClick={() => setMode('create')}
              className="p-6 rounded-lg border-2 border-gold-ancient/30 hover:border-forest/50 cursor-pointer transition-all glass-rune group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-forest/20 flex items-center justify-center shrink-0 group-hover:bg-forest/30 transition-colors">
                  <Wand2 className="h-6 w-6 text-forest" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-parchment mb-1">
                    Create from Scratch
                  </h3>
                  <p className="text-sm text-parchment-dim">
                    Build a new bot step by step using the creation wizard.
                    Define personality, behavior, knowledge, and more.
                  </p>
                </div>
              </div>
            </div>

            {/* Import Character Card */}
            <div className="p-6 rounded-lg border-2 border-gold-ancient/30 glass-rune">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gold-ancient/10 flex items-center justify-center shrink-0">
                  <Bot className="h-6 w-6 text-gold-ancient" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-parchment mb-1">
                    Import Character Card
                  </h3>
                  <p className="text-sm text-parchment-dim mb-3">
                    Import a SillyTavern/TavernAI character card (.png or .json).
                    The card data will pre-fill the creation form for you to review.
                  </p>
                  <ImportCardDialog onImport={handleImport} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
