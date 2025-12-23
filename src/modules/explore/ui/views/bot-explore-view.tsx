'use client'

import { Suspense } from 'react'
import { BotFilters } from '../components/bot-filters'
import { BotSort } from '../components/bot-sort'
import { BotList, BotListSkeleton } from '../components/bot-list'

export const BotExploreView = () => {
  return (
    <div className="px-4 lg:px-12 py-8 flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-y-2 lg:gap-y-0 justify-between">
        <h1 className="text-4xl font-display font-bold text-gold-rich">Discover Bots</h1>
        <BotSort />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-8 gap-y-6 gap-x-12">
        <div className="lg:col-span-2 xl:col-span-2">
          <BotFilters />
        </div>
        <div className="lg:col-span-4 xl:col-span-6">
          <Suspense fallback={<BotListSkeleton />}>
            <BotList />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
