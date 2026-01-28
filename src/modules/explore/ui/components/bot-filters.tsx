'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

const classificationOptions = [
  { value: 'conversational-ai', label: 'Conversational AI' },
  { value: 'creative-writing', label: 'Creative Writing' },
  { value: 'fantasy-rpg', label: 'Fantasy/RPG' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'fanfic', label: 'Fanfic' },
  { value: 'oc', label: 'OC (Original Characters)' },
  { value: 'dead-dove', label: 'Dead Dove' },
  { value: 'comedy-parody', label: 'Comedy/Parody' },
  { value: 'long-form', label: 'Long-form' },
  { value: 'one-shot', label: 'One-shot' },
]

export const BotFilters = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>(
    searchParams.get('classifications')?.split(',').filter(Boolean) || []
  )

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchQuery) {
        params.set('search', searchQuery)
      } else {
        params.delete('search')
      }
      router.push(`?${params.toString()}`)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, router, searchParams])

  // Handle classification filter changes
  const handleClassificationChange = (value: string) => {
    const newSelections = selectedClassifications.includes(value)
      ? selectedClassifications.filter(c => c !== value)
      : [...selectedClassifications, value]

    setSelectedClassifications(newSelections)

    const params = new URLSearchParams(searchParams.toString())
    if (newSelections.length > 0) {
      params.set('classifications', newSelections.join(','))
    } else {
      params.delete('classifications')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <Card className="glass-rune p-6 space-y-6">
      <div>
        <Label htmlFor="search" className="text-parchment font-lore text-lg">
          Search Bots
        </Label>
        <Input
          id="search"
          type="text"
          placeholder="Search by name, description, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-2 bg-[#0a140a]/50 border-gold-ancient/30 text-parchment placeholder:text-parchment-dim focus:border-gold-rich focus:ring-gold-rich/20"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-parchment font-lore font-semibold">Filter by</h3>

        <div className="space-y-3">
          <Label className="text-parchment-dim font-lore text-sm">Classification</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {classificationOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClassifications.includes(option.value)}
                  onChange={() => handleClassificationChange(option.value)}
                  className="rounded border-gold-ancient/30 text-gold-rich focus:ring-gold-rich/20"
                />
                <span className="text-parchment font-lore text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
