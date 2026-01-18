'use client'

/**
 * PersonaSwitcher Component
 *
 * Dropdown to switch personas mid-conversation.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, ChevronDown, UserX, Loader2 } from 'lucide-react'

interface Persona {
  id: number
  name: string
  avatar?: { url: string }
}

export interface PersonaSwitcherProps {
  currentPersonaId?: number | null
  onSelect: (personaId: number | null) => void
  disabled?: boolean
  className?: string
}

export function PersonaSwitcher({
  currentPersonaId,
  onSelect,
  disabled,
  className,
}: PersonaSwitcherProps) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  // Fetch user's personas
  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const response = await fetch('/api/personas')
        const data = await response.json() as { personas?: Persona[] }
        if (response.ok) {
          setPersonas(data.personas || [])
        }
      } catch (error) {
        console.error('Failed to fetch personas:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPersonas()
  }, [])

  const currentPersona = personas.find((p) => p.id === currentPersonaId)

  const handleSelect = (personaId: number | null) => {
    onSelect(personaId)
    setIsOpen(false)
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
          ) : currentPersona ? (
            <>
              <Avatar className="h-5 w-5 mr-2">
                <AvatarImage src={currentPersona.avatar?.url} />
                <AvatarFallback className="text-xs">
                  {currentPersona.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[100px] truncate">{currentPersona.name}</span>
            </>
          ) : (
            <>
              <User className="h-4 w-4 mr-2" />
              <span>No Persona</span>
            </>
          )}
          <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch Persona</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* No persona option */}
        <DropdownMenuItem
          onClick={() => handleSelect(null)}
          className="cursor-pointer"
        >
          <UserX className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>No Persona</span>
          {!currentPersonaId && (
            <span className="ml-auto text-xs text-primary">Active</span>
          )}
        </DropdownMenuItem>

        {personas.length > 0 && <DropdownMenuSeparator />}

        {/* Persona list */}
        {personas.map((persona) => (
          <DropdownMenuItem
            key={persona.id}
            onClick={() => handleSelect(persona.id)}
            className="cursor-pointer"
          >
            <Avatar className="h-5 w-5 mr-2">
              <AvatarImage src={persona.avatar?.url} />
              <AvatarFallback className="text-xs">
                {persona.name[0]}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{persona.name}</span>
            {currentPersonaId === persona.id && (
              <span className="ml-auto text-xs text-primary">Active</span>
            )}
          </DropdownMenuItem>
        ))}

        {personas.length === 0 && !isLoading && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No personas created yet
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
