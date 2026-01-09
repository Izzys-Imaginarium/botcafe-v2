import * as migration_20251220_200552 from './20251220_200552';
import * as migration_20260106_055410 from './20260106_055410';
import * as migration_20260107_044301 from './20260107_044301';

export const migrations = [
  {
    up: migration_20251220_200552.up,
    down: migration_20251220_200552.down,
    name: '20251220_200552',
  },
  {
    up: migration_20260106_055410.up,
    down: migration_20260106_055410.down,
    name: '20260106_055410',
  },
  {
    up: migration_20260107_044301.up,
    down: migration_20260107_044301.down,
    name: '20260107_044301',
  },
];
