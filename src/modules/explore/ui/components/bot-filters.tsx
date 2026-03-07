'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { type ExploreTheme, mainTheme } from '../../explore-theme'

interface BotFiltersProps {
  theme?: ExploreTheme
}

export const BotFilters = ({ theme = mainTheme }: BotFiltersProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = theme.classes
  const s = theme.strings

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>(
    searchParams.get(theme.classificationParam)?.split(',').filter(Boolean) || []
  )
  const [hideMyBots, setHideMyBots] = useState(searchParams.get('excludeOwn') === 'true')
  const [showLiked, setShowLiked] = useState(searchParams.get('liked') === 'true')
  const [showFavorited, setShowFavorited] = useState(searchParams.get('favorited') === 'true')

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

  const handleClassificationChange = (value: string) => {
    const newSelections = selectedClassifications.includes(value)
      ? selectedClassifications.filter(c => c !== value)
      : [...selectedClassifications, value]

    setSelectedClassifications(newSelections)

    const params = new URLSearchParams(searchParams.toString())
    if (newSelections.length > 0) {
      params.set(theme.classificationParam, newSelections.join(','))
    } else {
      params.delete(theme.classificationParam)
    }
    router.push(`?${params.toString()}`)
  }

  const handleToggle = (key: string, checked: boolean, setter: (v: boolean) => void) => {
    setter(checked)
    const params = new URLSearchParams(searchParams.toString())
    if (checked) {
      params.set(key, 'true')
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <Card className={`${t.glassPanel} p-6 space-y-6`}>
      <div>
        <Label htmlFor="search" className={`${t.text} font-lore text-lg`}>
          {s.searchLabel}
        </Label>
        <Input
          id="search"
          type="text"
          placeholder={s.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`mt-2 ${t.inputBg}`}
        />
      </div>

      <div className="space-y-4">
        <h3 className={`${t.text} font-lore font-semibold`}>{s.filterHeading}</h3>

        <div className="space-y-3">
          <Label className={`${t.textDim} font-lore text-sm`}>{s.classificationLabel}</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {theme.classificationOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClassifications.includes(option.value)}
                  onChange={() => handleClassificationChange(option.value)}
                  className={`rounded ${t.checkboxBorder} ${t.checkboxAccent}`}
                />
                <span className={`${t.text} font-lore text-sm`}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={`space-y-3 pt-4 border-t ${t.border}`}>
          <Label className={`${t.textDim} font-lore text-sm`}>My Interactions</Label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showLiked}
              onChange={(e) => handleToggle('liked', e.target.checked, setShowLiked)}
              className={`rounded ${t.checkboxBorder} ${t.checkboxAccent}`}
            />
            <span className={`${t.text} font-lore text-sm`}>Liked</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFavorited}
              onChange={(e) => handleToggle('favorited', e.target.checked, setShowFavorited)}
              className={`rounded ${t.checkboxBorder} ${t.checkboxAccent}`}
            />
            <span className={`${t.text} font-lore text-sm`}>Favorited</span>
          </label>
        </div>

        <div className={`space-y-3 pt-4 border-t ${t.border}`}>
          <Label className={`${t.textDim} font-lore text-sm`}>Visibility</Label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hideMyBots}
              onChange={(e) => handleToggle('excludeOwn', e.target.checked, setHideMyBots)}
              className={`rounded ${t.checkboxBorder} ${t.checkboxAccent}`}
            />
            <span className={`${t.text} font-lore text-sm`}>Hide my bots</span>
          </label>
        </div>
      </div>
    </Card>
  )
}
