'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export const BotFilters = () => {
  const [searchQuery, setSearchQuery] = useState('')

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
          <Label className="text-parchment-dim font-lore text-sm">Bot Type</Label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gold-ancient/30 text-gold-rich focus:ring-gold-rich/20"
              />
              <span className="text-parchment font-lore text-sm">Assistant</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gold-ancient/30 text-gold-rich focus:ring-gold-rich/20"
              />
              <span className="text-parchment font-lore text-sm">Creative</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gold-ancient/30 text-gold-rich focus:ring-gold-rich/20"
              />
              <span className="text-parchment font-lore text-sm">Educational</span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-parchment-dim font-lore text-sm">Popularity</Label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gold-ancient/30 text-gold-rich focus:ring-gold-rich/20"
              />
              <span className="text-parchment font-lore text-sm">Most Liked</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gold-ancient/30 text-gold-rich focus:ring-gold-rich/20"
              />
              <span className="text-parchment font-lore text-sm">Most Favorited</span>
            </label>
          </div>
        </div>
      </div>
    </Card>
  )
}
