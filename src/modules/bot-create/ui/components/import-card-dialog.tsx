'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileImage, Loader2, BookMarked } from 'lucide-react'
import { toast } from 'sonner'
import type { BotFormData } from './bot-wizard-form'
import type { CharacterBook } from '@/lib/tavern-card'

interface ImportCardDialogProps {
  onImport: (data: {
    formData: Partial<BotFormData>
    pictureId?: string | number
    pictureUrl?: string
    characterBook?: CharacterBook | null
  }) => void
}

export function ImportCardDialog({ onImport }: ImportCardDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
    const isJson = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')

    if (!isPng && !isJson) {
      setError('Please select a PNG character card or a JSON character card file.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.')
      return
    }

    setSelectedFile(file)

    // Show preview for PNG files
    if (isPng) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/bots/import-card', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json() as {
        success?: boolean
        error?: string
        formData?: Partial<BotFormData>
        pictureId?: string | number
        pictureUrl?: string
        characterBook?: CharacterBook | null
        characterBookSummary?: { name: string; entryCount: number } | null
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to import character card.')
      }

      const loreInfo = result.characterBookSummary
        ? ` Includes ${result.characterBookSummary.entryCount} lore entries that will be imported after bot creation.`
        : ''

      toast.success(`Character card imported successfully!${loreInfo}`)

      onImport({
        formData: result.formData!,
        pictureId: result.pictureId,
        pictureUrl: result.pictureUrl,
        characterBook: result.characterBook,
      })

      setOpen(false)
      resetState()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import character card.'
      setError(message)
    } finally {
      setIsUploading(false)
    }
  }

  const resetState = () => {
    setSelectedFile(null)
    setPreview(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetState()
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="glass-rune border-gold-ancient/30 hover:border-gold-rich hover:text-gold-rich"
        >
          <Upload className="mr-2 h-4 w-4" />
          Import Character Card
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md glass-rune overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-gold-rich font-display">
            Import Character Card
          </DialogTitle>
          <DialogDescription>
            Upload a SillyTavern character card (.png) or a JSON character card file (.json) to import a bot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Input */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.json,image/png,application/json"
              onChange={handleFileSelect}
              className="hidden"
              id="card-file-input"
            />

            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gold-ancient/30 rounded-lg p-8 text-center cursor-pointer hover:border-gold-rich/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileImage className="h-12 w-12 mx-auto text-gold-ancient/50 mb-3" />
                <p className="text-parchment font-medium mb-1">Choose a file</p>
                <p className="text-sm text-parchment-dim">
                  PNG character card or JSON file, up to 10MB
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* PNG Preview */}
                {preview && (
                  <div className="flex justify-center">
                    <img
                      src={preview}
                      alt="Character card preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-forest"
                    />
                  </div>
                )}

                {/* File Info */}
                <div className="flex items-center justify-between gap-2 p-3 bg-[#0a140a]/50 rounded-lg border border-gold-ancient/20 overflow-hidden">
                  <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    <FileImage className="h-4 w-4 text-gold-ancient shrink-0" />
                    <span className="text-sm text-parchment truncate block">
                      {selectedFile.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetState()
                    }}
                    className="text-parchment-dim hover:text-parchment shrink-0"
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Info about what happens */}
          <div className="p-3 bg-forest/10 border border-forest/30 rounded-lg">
            <div className="flex items-start gap-2">
              <BookMarked className="h-4 w-4 text-forest mt-0.5 shrink-0" />
              <p className="text-xs text-parchment-dim">
                The character card data will be used to pre-fill the bot creation form.
                You can review and edit all fields before saving.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="glass-rune"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isUploading}
              className="bg-forest hover:bg-forest/90 text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
