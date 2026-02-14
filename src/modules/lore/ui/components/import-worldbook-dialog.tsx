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
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Loader2, BookOpen, Check, X, Zap, Key, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { parseWorldBook, getWorldBookSummary } from '@/lib/tavern-card/world-book'
import type { WorldBook } from '@/lib/tavern-card/types'

interface ImportWorldBookDialogProps {
  onImport: (data: {
    collectionId: number | string
    collectionName: string
    entryCount: number
  }) => void
}

export function ImportWorldBookDialog({ onImport }: ImportWorldBookDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedBook, setParsedBook] = useState<WorldBook | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setParseError(null)
    setParsedBook(null)

    const isJson = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')
    if (!isJson) {
      setParseError('Please select a JSON World Book file.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setParseError('File is too large. Maximum size is 10MB.')
      return
    }

    setSelectedFile(file)

    // Parse locally for preview
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const worldBook = parseWorldBook(json)
      setParsedBook(worldBook)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse file'
      setParseError(message)
      setSelectedFile(null)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    setParseError(null)

    try {
      // Base64-encode the file to bypass Cloudflare WAF
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          resolve(dataUrl.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(selectedFile)
      })

      const response = await fetch('/api/knowledge-collections/import-worldbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: fileBase64,
          filename: selectedFile.name,
        }),
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const errBody = await response.json() as { error?: string }
          throw new Error(errBody.error || `Import failed (${response.status})`)
        }
        throw new Error(`Import failed with status ${response.status}. Please try again.`)
      }

      const result = await response.json() as {
        success?: boolean
        error?: string
        collectionId?: number | string
        collectionName?: string
        totalEntries?: number
        importedEntries?: number
        skippedEntries?: number
        vectorizedEntries?: number
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to import World Book.')
      }

      const skippedInfo = result.skippedEntries
        ? ` (${result.skippedEntries} skipped)`
        : ''

      toast.success(`Imported ${result.importedEntries} entries into "${result.collectionName}"${skippedInfo}`)

      onImport({
        collectionId: result.collectionId!,
        collectionName: result.collectionName!,
        entryCount: result.importedEntries!,
      })

      setOpen(false)
      resetState()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import World Book.'
      setParseError(message)
    } finally {
      setIsImporting(false)
    }
  }

  const resetState = () => {
    setSelectedFile(null)
    setParsedBook(null)
    setParseError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const summary = parsedBook ? getWorldBookSummary(parsedBook) : null

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
          Import World Book
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg glass-rune">
        <DialogHeader className="min-w-0">
          <DialogTitle className="text-gold-rich font-display">
            Import World Book
          </DialogTitle>
          <DialogDescription>
            Upload a SillyTavern World Book (.json) to import lore entries as a new tome.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 min-w-0">
          {/* File Input */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
              id="worldbook-file-input"
            />

            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gold-ancient/30 rounded-lg p-8 text-center cursor-pointer hover:border-gold-rich/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <BookOpen className="h-12 w-12 mx-auto text-gold-ancient/50 mb-3" />
                <p className="text-parchment font-medium mb-1">Choose a World Book file</p>
                <p className="text-sm text-parchment-dim">
                  JSON file, up to 10MB
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 p-3 bg-[#0a140a]/50 rounded-lg border border-gold-ancient/20 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  <FileText className="h-4 w-4 text-gold-ancient shrink-0" />
                  <span className="text-sm text-parchment truncate block">
                    {selectedFile.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="text-parchment-dim hover:text-parchment shrink-0"
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          {/* Entry Preview */}
          {summary && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-parchment">
                  {summary.enabledEntries} {summary.enabledEntries === 1 ? 'entry' : 'entries'} to import
                </span>
                {summary.disabledEntries > 0 && (
                  <Badge variant="outline" className="text-parchment-dim border-gold-ancient/20 text-xs">
                    {summary.disabledEntries} disabled
                  </Badge>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto rounded-lg border border-gold-ancient/20 bg-[#0a140a]/30">
                {summary.entries.map((entry) => (
                  <div
                    key={entry.uid}
                    className={`flex items-start gap-2 px-3 py-2 border-b border-gold-ancient/10 last:border-b-0 ${
                      !entry.enabled ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {entry.enabled ? (
                        <Check className="h-3.5 w-3.5 text-forest" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-parchment-dim" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-parchment truncate">{entry.comment}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <ModeIcon mode={entry.mode} />
                        {entry.keywords.length > 0 && (
                          <span className="text-xs text-parchment-dim truncate">
                            {entry.keywords.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {parseError && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{parseError}</p>
            </div>
          )}

          {/* Info about what happens */}
          {parsedBook && (
            <div className="p-3 bg-forest/10 border border-forest/30 rounded-lg">
              <div className="flex items-start gap-2">
                <BookOpen className="h-4 w-4 text-forest mt-0.5 shrink-0" />
                <p className="text-xs text-parchment-dim">
                  A new tome will be created with these entries. You can link it to any bot from the bot settings after import.
                </p>
              </div>
            </div>
          )}

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
              disabled={!parsedBook || isImporting}
              className="bg-forest hover:bg-forest/90 text-white"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import {summary?.enabledEntries || 0} {(summary?.enabledEntries || 0) === 1 ? 'Entry' : 'Entries'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ModeIcon({ mode }: { mode: string }) {
  switch (mode) {
    case 'keyword':
      return <Key className="h-3 w-3 text-gold-ancient/60 shrink-0" />
    case 'vector':
      return <Zap className="h-3 w-3 text-forest/60 shrink-0" />
    case 'hybrid':
      return <Eye className="h-3 w-3 text-gold-rich/60 shrink-0" />
    case 'constant':
      return <Check className="h-3 w-3 text-forest/60 shrink-0" />
    default:
      return null
  }
}
