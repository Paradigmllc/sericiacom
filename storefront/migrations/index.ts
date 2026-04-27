import * as migration_20260421_214228 from './20260421_214228';
import * as migration_20260427_060247 from './20260427_060247';

export const migrations = [
  {
    up: migration_20260421_214228.up,
    down: migration_20260421_214228.down,
    name: '20260421_214228',
  },
  {
    up: migration_20260427_060247.up,
    down: migration_20260427_060247.down,
    name: '20260427_060247'
  },
];
