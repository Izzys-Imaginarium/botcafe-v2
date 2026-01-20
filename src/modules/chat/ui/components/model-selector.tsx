'use client'

/**
 * ModelSelector Component
 *
 * Dropdown to select which AI model to use for chat.
 * Models are filtered based on the selected API key's provider.
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Cpu, ChevronDown, Pencil } from 'lucide-react'

// Provider model info - updated January 2026
const providerModels: Record<string, { models: string[]; default: string; displayName: string }> = {
  openai: {
    displayName: 'OpenAI',
    default: 'gpt-4.1-mini',
    models: [
      // GPT-5.x Series (Latest)
      'gpt-5.2',
      'gpt-5.2-chat',
      'gpt-5.1',
      'gpt-5',
      'gpt-5-mini',
      'gpt-5-nano',
      // Codex models
      'gpt-5.2-codex',
      'gpt-5.1-codex',
      'gpt-5.1-codex-mini',
      // GPT-4.x Series
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4o',
      'gpt-4o-mini',
      // Reasoning models
      'o1-preview',
      'o1-mini',
    ],
  },
  anthropic: {
    displayName: 'Anthropic',
    default: 'claude-sonnet-4-5-20250929',
    models: [
      // Claude 4.5 Series (Latest)
      'claude-opus-4-5-20251101',
      'claude-sonnet-4-5-20250929',
      'claude-haiku-4-5-20251001',
      // Claude 4.x Series (Legacy)
      'claude-opus-4-1-20250805',
      'claude-sonnet-4-20250514',
      'claude-opus-4-20250514',
      // Claude 3.x Series (Legacy)
      'claude-3-7-sonnet-20250219',
      'claude-3-haiku-20240307',
    ],
  },
  google: {
    displayName: 'Google',
    default: 'gemini-2.5-flash',
    models: [
      // Gemini 3 (Preview)
      'gemini-3-pro-preview',
      'gemini-3-flash-preview',
      'gemini-3-pro-image-preview',
      // Gemini 2.5 (Stable)
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      // Gemini 2.0 (Being retired March 2026)
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
    ],
  },
  deepseek: {
    displayName: 'DeepSeek',
    default: 'deepseek-chat',
    models: [
      'deepseek-chat',
      'deepseek-reasoner',
    ],
  },
  groq: {
    displayName: 'Groq',
    default: 'llama-3.3-70b-versatile',
    models: [
      // Llama models
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'meta-llama/llama-4-maverick-17b-128e-instruct',
      // OpenAI open models
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      // Compound models
      'groq/compound',
      'groq/compound-mini',
      // Other models
      'qwen/qwen3-32b',
      'moonshotai/kimi-k2-instruct-0905',
    ],
  },
  openrouter: {
    displayName: 'OpenRouter',
    default: '', // No default - user must enter custom model
    models: [], // No predefined models - custom input only
  },
  electronhub: {
    displayName: 'ElectronHub',
    default: '', // No default - user must enter custom model
    models: [], // No predefined models - custom input only
  },
}

// Friendly model names for display
const modelDisplayNames: Record<string, string> = {
  // OpenAI - GPT-5.x Series
  'gpt-5.2': 'GPT-5.2',
  'gpt-5.2-chat': 'GPT-5.2 Chat',
  'gpt-5.1': 'GPT-5.1',
  'gpt-5': 'GPT-5',
  'gpt-5-mini': 'GPT-5 Mini',
  'gpt-5-nano': 'GPT-5 Nano',
  'gpt-5.2-codex': 'GPT-5.2 Codex',
  'gpt-5.1-codex': 'GPT-5.1 Codex',
  'gpt-5.1-codex-mini': 'GPT-5.1 Codex Mini',
  // OpenAI - GPT-4.x Series
  'gpt-4.1': 'GPT-4.1',
  'gpt-4.1-mini': 'GPT-4.1 Mini',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'o1-preview': 'o1 Preview',
  'o1-mini': 'o1 Mini',
  // Anthropic - Claude 4.5 Series
  'claude-opus-4-5-20251101': 'Claude Opus 4.5',
  'claude-sonnet-4-5-20250929': 'Claude Sonnet 4.5',
  'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
  // Anthropic - Claude 4.x Series
  'claude-opus-4-1-20250805': 'Claude Opus 4.1',
  'claude-sonnet-4-20250514': 'Claude Sonnet 4',
  'claude-opus-4-20250514': 'Claude Opus 4',
  // Anthropic - Claude 3.x Series
  'claude-3-7-sonnet-20250219': 'Claude 3.7 Sonnet',
  'claude-3-haiku-20240307': 'Claude 3 Haiku',
  // Google - Gemini 3
  'gemini-3-pro-preview': 'Gemini 3 Pro (Preview)',
  'gemini-3-flash-preview': 'Gemini 3 Flash (Preview)',
  'gemini-3-pro-image-preview': 'Gemini 3 Pro Image (Preview)',
  // Google - Gemini 2.5
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
  // Google - Gemini 2.0
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite',
  // DeepSeek
  'deepseek-chat': 'DeepSeek Chat',
  'deepseek-reasoner': 'DeepSeek Reasoner',
  // Groq - Llama models
  'llama-3.3-70b-versatile': 'Llama 3.3 70B',
  'llama-3.1-8b-instant': 'Llama 3.1 8B Instant',
  'meta-llama/llama-4-scout-17b-16e-instruct': 'Llama 4 Scout 17B',
  'meta-llama/llama-4-maverick-17b-128e-instruct': 'Llama 4 Maverick 17B',
  // Groq - OpenAI open models
  'openai/gpt-oss-120b': 'GPT-OSS 120B',
  'openai/gpt-oss-20b': 'GPT-OSS 20B',
  // Groq - Compound models
  'groq/compound': 'Groq Compound',
  'groq/compound-mini': 'Groq Compound Mini',
  // Groq - Other models
  'qwen/qwen3-32b': 'Qwen3 32B',
  'moonshotai/kimi-k2-instruct-0905': 'Kimi K2',
  // OpenRouter - Anthropic
  'anthropic/claude-opus-4.5': 'Claude Opus 4.5',
  'anthropic/claude-sonnet-4.5': 'Claude Sonnet 4.5',
  'anthropic/claude-haiku-4.5': 'Claude Haiku 4.5',
  // OpenRouter - OpenAI
  'openai/gpt-5.2': 'GPT-5.2',
  'openai/gpt-4.1': 'GPT-4.1',
  'openai/gpt-4o': 'GPT-4o',
  // OpenRouter - Google
  'google/gemini-3-pro-preview': 'Gemini 3 Pro',
  'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
  // OpenRouter - Meta
  'meta-llama/llama-4-maverick': 'Llama 4 Maverick',
  'meta-llama/llama-3.3-70b-instruct': 'Llama 3.3 70B',
  // OpenRouter - DeepSeek
  'deepseek/deepseek-chat': 'DeepSeek Chat',
  'deepseek/deepseek-r1': 'DeepSeek R1',
}

export interface ModelSelectorProps {
  provider?: string | null
  currentModel?: string | null
  onSelect: (model: string) => void
  disabled?: boolean
  className?: string
}

// Providers that support custom model input (they have hundreds of models)
const CUSTOM_MODEL_PROVIDERS = ['openrouter', 'electronhub']

export function ModelSelector({
  provider,
  currentModel,
  onSelect,
  disabled,
  className,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customModelDialogOpen, setCustomModelDialogOpen] = useState(false)
  const [customModelInput, setCustomModelInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Check if this provider supports custom model input
  const supportsCustomModel = provider ? CUSTOM_MODEL_PROVIDERS.includes(provider) : false

  // Get available models for the current provider
  const availableModels = useMemo(() => {
    if (!provider || !providerModels[provider]) {
      return []
    }
    return providerModels[provider].models
  }, [provider])

  const defaultModel = useMemo(() => {
    if (!provider || !providerModels[provider]) {
      return null
    }
    return providerModels[provider].default
  }, [provider])

  // Auto-select default model when provider changes
  useEffect(() => {
    if (provider && defaultModel && !currentModel) {
      onSelect(defaultModel)
    }
  }, [provider, defaultModel, currentModel, onSelect])

  // Reset model when provider changes and current model isn't in the list
  // But only for providers that don't support custom models
  useEffect(() => {
    if (provider && currentModel && availableModels.length > 0 && !supportsCustomModel) {
      if (!availableModels.includes(currentModel)) {
        onSelect(defaultModel || availableModels[0])
      }
    }
  }, [provider, currentModel, availableModels, defaultModel, onSelect, supportsCustomModel])

  const handleSelect = (model: string) => {
    onSelect(model)
    setIsOpen(false)
  }

  const handleCustomModelSubmit = () => {
    const trimmed = customModelInput.trim()
    if (trimmed) {
      onSelect(trimmed)
      setCustomModelDialogOpen(false)
      setCustomModelInput('')
    }
  }

  const openCustomModelDialog = () => {
    setCustomModelInput(currentModel || '')
    setCustomModelDialogOpen(true)
    setIsOpen(false)
    // Focus input after dialog opens
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const getModelDisplayName = (model: string) => {
    return modelDisplayNames[model] || model
  }

  // Check if current model is a custom one (not in the predefined list)
  const isCustomModel = currentModel && !availableModels.includes(currentModel)

  // No provider selected
  if (!provider) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className={className}
      >
        <Cpu className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="text-muted-foreground">Select API Key First</span>
      </Button>
    )
  }

  // No models available and not a custom model provider
  if (availableModels.length === 0 && !supportsCustomModel) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className={className}
      >
        <Cpu className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="text-muted-foreground">No Models</span>
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={className}
          >
            <Cpu className="h-4 w-4 mr-2" />
            <span className="max-w-[140px] truncate">
              {currentModel ? getModelDisplayName(currentModel) : 'Select Model'}
            </span>
            <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
          <DropdownMenuLabel>
            Select Model ({providerModels[provider]?.displayName || provider})
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Custom model option for supported providers */}
          {supportsCustomModel && (
            <>
              <DropdownMenuItem
                onClick={openCustomModelDialog}
                className="cursor-pointer"
              >
                <Pencil className="h-4 w-4 mr-2 text-muted-foreground" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span>Enter Custom Model</span>
                  <span className="text-xs text-muted-foreground">Type any model ID</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Show current custom model if it's not in the list */}
          {isCustomModel && (
            <>
              <DropdownMenuItem
                onClick={() => handleSelect(currentModel!)}
                className="cursor-pointer bg-primary/5"
              >
                <Cpu className="h-4 w-4 mr-2 text-primary" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="truncate">{currentModel}</span>
                  <span className="text-xs text-muted-foreground">Custom model</span>
                </div>
                <span className="ml-auto text-xs text-primary shrink-0">Active</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Model list */}
          {availableModels.map((model) => (
            <DropdownMenuItem
              key={model}
              onClick={() => handleSelect(model)}
              className="cursor-pointer"
            >
              <Cpu className="h-4 w-4 mr-2 text-muted-foreground" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="truncate">{getModelDisplayName(model)}</span>
                <span className="text-xs text-muted-foreground truncate">{model}</span>
              </div>
              {currentModel === model && (
                <span className="ml-auto text-xs text-primary shrink-0">Active</span>
              )}
              {model === defaultModel && currentModel !== model && (
                <span className="ml-auto text-xs text-muted-foreground shrink-0">Default</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom model input dialog */}
      <Dialog open={customModelDialogOpen} onOpenChange={setCustomModelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Custom Model</DialogTitle>
            <DialogDescription>
              Enter the model ID exactly as provided by {providerModels[provider!]?.displayName || provider}.
              {provider === 'openrouter' && (
                <span className="block mt-1">
                  Format: <code className="bg-muted px-1 rounded">provider/model-name</code>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              ref={inputRef}
              value={customModelInput}
              onChange={(e) => setCustomModelInput(e.target.value)}
              placeholder={provider === 'openrouter' ? 'e.g., anthropic/claude-sonnet-4.5' : 'e.g., gpt-4.1'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomModelSubmit()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomModelDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomModelSubmit} disabled={!customModelInput.trim()}>
              Use Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
