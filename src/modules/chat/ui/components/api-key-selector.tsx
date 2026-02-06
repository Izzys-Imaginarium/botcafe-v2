'use client'

/**
 * ApiKeySelector Component
 *
 * Dropdown to select which API key to use for chat.
 */

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Key, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface ApiKey {
  id: number
  nickname: string
  provider: string
  is_active: boolean
}

// Provider display names and colors
const providerInfo: Record<string, { name: string; color: string }> = {
  openai: { name: 'OpenAI', color: 'text-green-500' },
  anthropic: { name: 'Anthropic', color: 'text-orange-500' },
  google: { name: 'Google', color: 'text-blue-500' },
  deepseek: { name: 'DeepSeek', color: 'text-purple-500' },
  openrouter: { name: 'OpenRouter', color: 'text-cyan-500' },
  electronhub: { name: 'ElectronHub', color: 'text-yellow-500' },
  glm: { name: 'GLM (Zhipu AI)', color: 'text-rose-500' },
}

export interface ApiKeySelectorProps {
  currentKeyId?: number | null
  onSelect: (keyId: number) => void
  onProviderChange?: (provider: string) => void
  disabled?: boolean
  className?: string
}

export function ApiKeySelector({
  currentKeyId,
  onSelect,
  onProviderChange,
  disabled,
  className,
}: ApiKeySelectorProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Stable refs for callbacks to avoid re-triggering the fetch effect
  const onSelectRef = useRef(onSelect)
  const onProviderChangeRef = useRef(onProviderChange)
  onSelectRef.current = onSelect
  onProviderChangeRef.current = onProviderChange

  // Fetch user's API keys
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const response = await fetch('/api/api-keys')
        const data = await response.json() as { keys?: ApiKey[] }
        if (response.ok) {
          // Only show active keys
          const activeKeys = (data.keys || []).filter((k) => k.is_active)
          setApiKeys(activeKeys)

          // Auto-select first key if none selected
          if (!currentKeyId && activeKeys.length > 0) {
            onSelectRef.current(activeKeys[0].id)
            if (onProviderChangeRef.current) {
              onProviderChangeRef.current(activeKeys[0].provider)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch API keys:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchApiKeys()
  }, [currentKeyId])

  const currentKey = apiKeys.find((k) => k.id === currentKeyId)
  const provider = currentKey?.provider
    ? providerInfo[currentKey.provider] || { name: currentKey.provider, color: 'text-muted-foreground' }
    : null

  const handleSelect = (keyId: number) => {
    const selectedKey = apiKeys.find((k) => k.id === keyId)
    onSelect(keyId)
    if (selectedKey && onProviderChange) {
      onProviderChange(selectedKey.provider)
    }
    setIsOpen(false)
  }

  // No API keys state
  if (!isLoading && apiKeys.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        asChild
        className={className}
      >
        <Link href="/account" className="text-destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          Add API Key
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || isLoading}
          className={className}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : currentKey ? (
            <>
              <Key className={`h-4 w-4 mr-2 ${provider?.color || ''}`} />
              <span className="max-w-[120px] truncate">
                {currentKey.nickname || provider?.name || 'API Key'}
              </span>
            </>
          ) : (
            <>
              <Key className="h-4 w-4 mr-2" />
              <span>Select Key</span>
            </>
          )}
          <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Select API Key</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* API key list */}
        {apiKeys.map((key) => {
          const keyProvider = providerInfo[key.provider] || {
            name: key.provider,
            color: 'text-muted-foreground',
          }
          return (
            <DropdownMenuItem
              key={key.id}
              onClick={() => handleSelect(key.id)}
              className="cursor-pointer"
            >
              <Key className={`h-4 w-4 mr-2 ${keyProvider.color}`} />
              <div className="flex flex-col">
                <span className="truncate">{key.nickname || `${keyProvider.name} Key`}</span>
                <span className="text-xs text-muted-foreground">
                  {keyProvider.name}
                </span>
              </div>
              {currentKeyId === key.id && (
                <span className="ml-auto text-xs text-primary">Active</span>
              )}
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" className="cursor-pointer text-muted-foreground">
            <span className="text-sm">Manage API Keys</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
