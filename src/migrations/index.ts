import * as migration_20250929_111647 from './20250929_111647'
import * as migration_20251218_032616 from './20251218_032616'
import * as migration_20251218_040800 from './20251218_040800'

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20251218_032616.up,
    down: migration_20251218_032616.down,
    name: '20251218_032616',
  },
  {
    up: migration_20251218_040800.up,
    down: migration_20251218_040800.down,
    name: '20251218_040800',
  },
]
