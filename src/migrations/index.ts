import * as migration_20251220_200552 from './20251220_200552';

export const migrations = [
  {
    up: migration_20251220_200552.up,
    down: migration_20251220_200552.down,
    name: '20251220_200552'
  },
];
