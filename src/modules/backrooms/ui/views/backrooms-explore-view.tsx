'use client'

import { Suspense } from 'react'
import { BotFilters } from '@/modules/explore/ui/components/bot-filters'
import { BotSort } from '@/modules/explore/ui/components/bot-sort'
import { BotList, BotListSkeleton } from '@/modules/explore/ui/components/bot-list'
import { backroomsTheme } from '@/modules/explore/explore-theme'

export const BackroomsExploreView = () => {
  return (
    <div className="px-4 lg:px-12 py-8 flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-y-2 lg:gap-y-0 justify-between">
        <h1 className="text-4xl font-display font-bold text-velvet text-glow-velvet">
          The Backrooms
        </h1>
        <BotSort theme={backroomsTheme} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-8 gap-y-6 gap-x-12">
        <div className="lg:col-span-2 xl:col-span-2">
          <BotFilters theme={backroomsTheme} />
        </div>
        <div className="lg:col-span-4 xl:col-span-6">
          <Suspense fallback={<BotListSkeleton theme={backroomsTheme} />}>
            <BotList theme={backroomsTheme} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
