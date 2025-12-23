'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const BotSort = () => {
  return (
    <div className="flex items-center gap-2">
      <label className="text-parchment font-lore text-sm whitespace-nowrap">Sort by</label>
      <Select>
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
            value="description"
            className="text-parchment hover:bg-gold-ancient/20 focus:bg-gold-ancient/20"
          >
            Description
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
        </SelectContent>
      </Select>
    </div>
  )
}
