'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type ExploreTheme, mainTheme } from '../../explore-theme'

interface BotSortProps {
  theme?: ExploreTheme
}

export const BotSort = ({ theme = mainTheme }: BotSortProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') || 'random'
  const t = theme.classes

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    router.push(`?${params.toString()}`)
  }

  const itemClass = `${t.text} ${t.buttonHover} focus:${t.buttonHover}`

  return (
    <div className="flex items-center gap-2">
      <label className={`${t.text} font-lore text-sm whitespace-nowrap`}>Sort by</label>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className={`w-48 ${t.glassPanelBg} ${t.text}`}>
          <SelectValue placeholder="Choose sort option" />
        </SelectTrigger>
        <SelectContent className={t.glassPanelBg}>
          <SelectItem value="name" className={itemClass}>Name (A-Z)</SelectItem>
          <SelectItem value="name-desc" className={itemClass}>Name (Z-A)</SelectItem>
          <SelectItem value="creator" className={itemClass}>Creator</SelectItem>
          <SelectItem value="likes" className={itemClass}>Most Liked</SelectItem>
          <SelectItem value="favorites" className={itemClass}>Most Favorited</SelectItem>
          <SelectItem value="recent" className={itemClass}>Recently Created</SelectItem>
          <SelectItem value="recently-chatted" className={itemClass}>Recently Chatted</SelectItem>
          <SelectItem value="random" className={itemClass}>Random</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
