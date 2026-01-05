'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileJson,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type ImportFormat = 'plain' | 'json' | 'characterai'
type ImportMethod = 'file' | 'text'

interface ImportResult {
  success: boolean
  memory?: any
  messagesImported?: number
  summary?: string
  message: string
}

export const MemoryImportView = () => {
  const router = useRouter()
  const [importMethod, setImportMethod] = useState<ImportMethod>('file')
  const [format, setFormat] = useState<ImportFormat>('plain')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Text input state
  const [conversationText, setConversationText] = useState('')

  // Import result state
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }, [])

  const handleImportFile = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload')
      return
    }

    setIsUploading(true)
    setUploadProgress('Uploading file...')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('format', format)

      setUploadProgress('Processing conversation...')

      const response = await fetch('/api/memories/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json() as ImportResult

      if (data.success) {
        toast.success(`Successfully imported ${data.messagesImported} messages!`)
        setImportResult(data)
        setSelectedFile(null)

        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        toast.error(data.message || 'Failed to import conversation')
        setImportResult(data)
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('An error occurred during import')
    } finally {
      setIsUploading(false)
      setUploadProgress('')
    }
  }

  const handleImportText = async () => {
    if (!conversationText.trim()) {
      toast.error('Please enter conversation text')
      return
    }

    setIsUploading(true)
    setUploadProgress('Processing conversation...')

    try {
      const response = await fetch('/api/memories/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationText,
          format,
        }),
      })

      const data = await response.json() as ImportResult

      if (data.success) {
        toast.success(`Successfully imported ${data.messagesImported} messages!`)
        setImportResult(data)
        setConversationText('')
      } else {
        toast.error(data.message || 'Failed to import conversation')
        setImportResult(data)
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('An error occurred during import')
    } finally {
      setIsUploading(false)
      setUploadProgress('')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/lore">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lore
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Import Legacy Memories
        </h1>
        <p className="text-muted-foreground">
          Upload conversations from old BotCafe, Character.AI, or other platforms
        </p>
      </div>

      {/* Import Method Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Import Method</CardTitle>
          <CardDescription>
            Choose how you want to import your conversation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={importMethod === 'file' ? 'default' : 'outline'}
              onClick={() => setImportMethod('file')}
              className="h-24 flex flex-col items-center justify-center"
            >
              <Upload className="h-8 w-8 mb-2" />
              Upload File
            </Button>
            <Button
              variant={importMethod === 'text' ? 'default' : 'outline'}
              onClick={() => setImportMethod('text')}
              className="h-24 flex flex-col items-center justify-center"
            >
              <FileText className="h-8 w-8 mb-2" />
              Paste Text
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Format Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Conversation Format</CardTitle>
          <CardDescription>
            Select the format of your conversation data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as ImportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plain">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Plain Text (Speaker: Message)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center">
                    <FileJson className="mr-2 h-4 w-4" />
                    JSON Array
                  </div>
                </SelectItem>
                <SelectItem value="characterai">
                  <div className="flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Character.AI Export
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Format Examples */}
            <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
              <p className="font-semibold mb-2">Expected format:</p>
              {format === 'plain' && (
                <pre className="text-xs">
                  User: Hello there!{'\n'}
                  Bot: Hi! How can I help you?{'\n'}
                  User: Tell me a joke{'\n'}
                  Bot: Why did the chicken cross the road?
                </pre>
              )}
              {format === 'json' && (
                <pre className="text-xs">
                  {JSON.stringify([
                    { speaker: "User", message: "Hello there!" },
                    { speaker: "Bot", message: "Hi! How can I help you?" }
                  ], null, 2)}
                </pre>
              )}
              {format === 'characterai' && (
                <pre className="text-xs">
                  Character Name: Hello there!{'\n'}
                  User: Hi! How are you?{'\n'}
                  Character Name: I'm doing great!
                </pre>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {importMethod === 'file' ? 'Upload File' : 'Paste Conversation'}
          </CardTitle>
          <CardDescription>
            {importMethod === 'file'
              ? 'Select a file containing your conversation data'
              : 'Paste the conversation text directly'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {importMethod === 'file' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="file-upload">Conversation File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept=".txt,.json"
                  disabled={isUploading}
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </div>
                )}
              </div>

              <Button
                onClick={handleImportFile}
                disabled={!selectedFile || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadProgress}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Conversation
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="conversation-text">Conversation Text</Label>
                <Textarea
                  id="conversation-text"
                  value={conversationText}
                  onChange={(e) => setConversationText(e.target.value)}
                  placeholder="Paste your conversation here..."
                  rows={12}
                  disabled={isUploading}
                  className="font-mono text-sm"
                />
              </div>

              <Button
                onClick={handleImportText}
                disabled={!conversationText.trim() || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadProgress}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Conversation
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Import Result */}
      {importResult && (
        <Card className={importResult.success ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Import Successful
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Import Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{importResult.message}</p>

            {importResult.success && importResult.summary && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold mb-2">Generated Summary:</p>
                <p className="text-sm whitespace-pre-wrap">{importResult.summary}</p>
              </div>
            )}

            {importResult.success && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/memories/library')}
                >
                  View in Library
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setImportResult(null)}
                >
                  Import Another
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
