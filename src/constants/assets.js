export const ASSET_TYPE = Object.freeze({
  ANIMATION: 0,
  BUILDING: 1,
  MAP: 2,
  PATH: 3,
  SPELL: 4,
  UNIT: 5,
});

export const SPECIES = Object.freeze({
  DOG: 'dog',
  CAT: 'cat',
});

export const DIRECTION = Object.freeze({
  UP: 'up',
  DOWN: 'down',
});

export const SPELL_TYPE = Object.freeze({
  ATTACK: 7001,
  HEAL: 7002,
  BUFF: 7003,
  STUN: 7004,
});

export const SPELL_TYPE_REVERSED = Object.fromEntries(
  Object.entries(SPELL_TYPE).map(([key, value]) => [value, key]),
);

export const UNIT_TYPE = Object.freeze({
  NORMAL: 'normal',
  HEALER: 'healer',
  BUFFER: 'buffer',
});
