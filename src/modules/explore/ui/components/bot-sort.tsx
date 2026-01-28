'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const BotSort = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') || 'recent'

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-parchment font-lore text-sm whitespace-nowrap">Sort by</label>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-48 glass-rune border-gold-ancient/30 bg-[#0a140a]/50 text-parchment">
          <SelectValue placeholder="Choose sort option" />
        </SelectTrigger>
        <SelectContent className="glass-rune border-gold-ancient/30 bg-[#0a140a]">
          <SelectItem
            value="name"
            className="text-parchment hover:bg-gold-ancient/20 focus:bg-gold-ancient/20"
          >
            Name (A-Z)
          </SelectItem>
          <SelectItem
            value="name-desc"
            className="text-parchment hover:bg-gold-ancient/20 focus:bg-gold-ancient/20"
          >
            Name (Z-A)
          </SelectItem>
          <SelectItem
            value="creator"
            className="text-parchment hover:bg-gold-ancient/20 focus:bg-gold-ancient/20"
          >
            Creator
          </SelectItem>
          <SelectItem
            value="likes"
            className="text-parchment hover:bg-gold-ancient/20 focus:bg-gold-ancient/20"
          >
            Most Liked
          </SelectItem>
          <SelectItem
            value="favorites"
            className="text-parchment hover:bg-gold-ancient/20 focus:bg-gold-ancient/20"
          >
            Most Favorited
          </SelectItem>
          <SelectItem
            value="recent"
            className="text-parchment hover:bg-gold-ancient/20 focus:bg-gold-ancient/20"
          >
            Recently Created
          </SelectItem>
          <SelectItem
            value="recently-chatted"
            className="text-parchment hover:bg-gold-ancient/20 focus:bg-gold-ancient/20"
          >
            Recently Chatted
          </SelectItem>
          <SelectItem
            value="random"
            className="text-parchment hover:bg-gold-ancient/20 focus:bg-gold-ancient/20"
          >
            Random
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
