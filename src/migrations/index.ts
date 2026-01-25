import * as migration_20251220_200552 from './20251220_200552';
import * as migration_20260106_055410 from './20260106_055410';
import * as migration_20260107_044301 from './20260107_044301';
import * as migration_20260114_025430 from './20260114_025430';
import * as migration_20260115_015404 from './20260115_015404';
import * as migration_20260122_053925 from './20260122_053925';
import * as migration_20260125_190048 from './20260125_190048';

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
  {
    up: migration_20260114_025430.up,
    down: migration_20260114_025430.down,
    name: '20260114_025430',
  },
  {
    up: migration_20260115_015404.up,
    down: migration_20260115_015404.down,
    name: '20260115_015404',
  },
  {
    up: migration_20260122_053925.up,
    down: migration_20260122_053925.down,
    name: '20260122_053925',
  },
  {
    up: migration_20260125_190048.up,
    down: migration_20260125_190048.down,
    name: '20260125_190048'
  },
];
