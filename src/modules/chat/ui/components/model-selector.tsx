'use client'

/**
 * ModelSelector Component
 *
 * Dropdown to select which AI model to use for chat.
 * Models are filtered based on the selected API key's provider.
 */

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Cpu, ChevronDown, Loader2 } from 'lucide-react'

// Provider model info - matches src/lib/llm/providers
const providerModels: Record<string, { models: string[]; default: string; displayName: string }> = {
  openai: {
    displayName: 'OpenAI',
    default: 'gpt-4o-mini',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-4',
      'gpt-4-32k',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      'o1-preview',
      'o1-mini',
    ],
  },
  anthropic: {
    displayName: 'Anthropic',
    default: 'claude-3-5-sonnet-20241022',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
    ],
  },
  google: {
    displayName: 'Google',
    default: 'gemini-1.5-pro',
    models: [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.0-pro',
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
    default: 'llama-3.1-70b-versatile',
    models: [
      'llama-3.1-405b-reasoning',
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'llama3-groq-70b-8192-tool-use-preview',
      'llama3-groq-8b-8192-tool-use-preview',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
  },
  openrouter: {
    displayName: 'OpenRouter',
    default: 'openai/gpt-4o',
    models: [
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-405b-instruct',
      'mistralai/mixtral-8x22b-instruct',
    ],
  },
  electronhub: {
    displayName: 'ElectronHub',
    default: 'gpt-4o',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'gemini-1.5-pro',
    ],
  },
}

// Friendly model names for display
const modelDisplayNames: Record<string, string> = {
  // OpenAI
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-4-turbo-preview': 'GPT-4 Turbo Preview',
  'gpt-4': 'GPT-4',
  'gpt-4-32k': 'GPT-4 32K',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K',
  'o1-preview': 'o1 Preview',
  'o1-mini': 'o1 Mini',
  // Anthropic
  'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
  'claude-3-opus-20240229': 'Claude 3 Opus',
  'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
  'claude-3-haiku-20240307': 'Claude 3 Haiku',
  'claude-opus-4-20250514': 'Claude 4 Opus',
  'claude-sonnet-4-20250514': 'Claude 4 Sonnet',
  // Google
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-1.5-flash-8b': 'Gemini 1.5 Flash 8B',
  'gemini-1.0-pro': 'Gemini 1.0 Pro',
  // DeepSeek
  'deepseek-chat': 'DeepSeek Chat',
  'deepseek-reasoner': 'DeepSeek Reasoner',
  // Groq
  'llama-3.1-405b-reasoning': 'Llama 3.1 405B',
  'llama-3.1-70b-versatile': 'Llama 3.1 70B',
  'llama-3.1-8b-instant': 'Llama 3.1 8B',
  'llama3-groq-70b-8192-tool-use-preview': 'Llama 3 70B Tool Use',
  'llama3-groq-8b-8192-tool-use-preview': 'Llama 3 8B Tool Use',
  'mixtral-8x7b-32768': 'Mixtral 8x7B',
  'gemma2-9b-it': 'Gemma 2 9B',
  // OpenRouter
  'openai/gpt-4o': 'GPT-4o',
  'openai/gpt-4o-mini': 'GPT-4o Mini',
  'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet',
  'anthropic/claude-3-opus': 'Claude 3 Opus',
  'google/gemini-pro-1.5': 'Gemini 1.5 Pro',
  'meta-llama/llama-3.1-405b-instruct': 'Llama 3.1 405B',
  'mistralai/mixtral-8x22b-instruct': 'Mixtral 8x22B',
}

export interface ModelSelectorProps {
  provider?: string | null
  currentModel?: string | null
  onSelect: (model: string) => void
  disabled?: boolean
  className?: string
}

export function ModelSelector({
  provider,
  currentModel,
  onSelect,
  disabled,
  className,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

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

  // Reset model when provider changes and current model isn't available
  useEffect(() => {
    if (provider && currentModel && availableModels.length > 0) {
      if (!availableModels.includes(currentModel)) {
        onSelect(defaultModel || availableModels[0])
      }
    }
  }, [provider, currentModel, availableModels, defaultModel, onSelect])

  const handleSelect = (model: string) => {
    onSelect(model)
    setIsOpen(false)
  }

  const getModelDisplayName = (model: string) => {
    return modelDisplayNames[model] || model
  }

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

  // No models available for provider
  if (availableModels.length === 0) {
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
  )
}
