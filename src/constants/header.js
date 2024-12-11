export const PACKET_TYPE_LENGTH = 2;
export const PACKET_VERSION_LENGTH = 1;
export const PACKET_SEQUENCE = 4;
export const PACKET_PAYLOAD_LENGTH = 2;

// TODO: S2C,C2S 넣을건지 확인 후 수정 필요.

export const PACKET_TYPE = Object.freeze({
  // 에러
  ERROR_NOTIFICATION: 1,

  // 인증
  AUTH_REQUEST: 2,
  AUTH_RESPONSE: 3,

  // 매칭
  MATCH_REQUEST: 30,
  MATCH_NOTIFICATION: 31,
  MATCH_CANCEL_REQUEST: 32,

  // 게임 시작
  GAME_START_REQUEST: 80,
  GAME_START_NOTIFICATION: 81,

  // 건물 구매
  PURCHASE_BUILDING_REQUEST: 100,
  PURCHASE_BUILDING_RESPONSE: 101,
  ADD_ENEMY_BUILDING_NOTIFICATION: 102,

  // 유닛 생성
  SPAWN_UNIT_REQUEST: 200,
  SPAWN_UNIT_RESPONSE: 201,
  SPAWN_ENEMY_UNIT_NOTIFICATION: 202,

  // 유닛 공격
  ATTACK_UNIT_REQUEST: 300,
  ATTACK_UNIT_RESPONSE: 301,
  ENEMY_UNIT_ATTACK_NOTIFICATION: 302,

  // 유닛 사망
  UNIT_DEATH_NOTIFICATION: 400,
  ENEMY_UNIT_DEATH_NOTIFICATION: 401,

  // 체크포인트 점령
  ENTER_CHECKPOINT_NOTIFICATION: 500,
  EXIT_CHECKPOINT_NOTIFICATION: 501,
  TRY_OCCUPATION_NOTIFICATION: 502,
  PAUSE_OCCUPATION_NOTIFICATION: 503,
  OCCUPATION_TIMER_RESET_NOTIFICATION: 504,
  OCCUPATION_SUCCESS_NOTIFICATION: 505,

  // 성채 공격
  ATTACK_BASE_REQUEST: 600,
  ATTACK_BASE_RESPONSE: 601,
  BASE_ATTACKED_NOTIFICATION: 602,

  // 게임 종료
  GAME_OVER_NOTIFICATION: 700,
  GAME_END_NOTIFICATION: 701,

  // 상태 동기화
  LOCATION_NOTIFICATION: 800,
  LOCATION_SYNC_NOTIFICATION: 801,
  MINERAL_SYNC_NOTIFICATION: 900,

  // 힐 스킬 관련
  HEAL_UNIT_REQUEST: 1000,
  HEAL_UNIT_RESPONSE: 1001,
  ENEMY_HEAL_UNIT_NOTIFICATION: 1002,

  // 버프 스킬 관련
  BUFF_UNIT_REQUEST: 1100,
  BUFF_UNIT_RESPONSE: 1101,
  ENEMY_BUFF_UNIT_NOTIFICATION: 1102,

  // 애니메이션 관련
  UNIT_ANIMATION_NOTIFICATION: 1200,
  ENEMY_UNIT_ANIMATION_NOTIFICATION: 1201,

  // 카드 관련
  DRAW_CARD_REQUEST: 1300,
  DRAW_CARD_RESPONSE: 1301,
  ELITE_CARD_NOTIFICATION: 1302,

  // 공격 스펠
  ATTACK_SPELL_REQUEST: 1400,
  ATTACK_SPELL_RESPONSE: 1401,
  ENEMY_ATTACK_SPELL_NOTIFICATION: 1402,

  // 힐 스펠
  HEAL_SPELL_REQUEST: 1403,
  HEAL_SPELL_RESPONSE: 1404,
  ENEMY_HEAL_SPELL_NOTIFICATION: 1405,

  // 버프 스펠
  BUFF_SPELL_REQUEST: 1406,
  BUFF_SPELL_RESPONSE: 1407,
  ENEMY_BUFF_SPELL_NOTIFICATION: 1408,

  // 스턴 스펠
  STUN_SPELL_REQUEST: 1409,
  STUN_SPELL_RESPONSE: 1410,
  ENEMY_STUN_SPELL_NOTIFICATION: 1411,
});

export const PACKET_TYPE_REVERSED = Object.fromEntries(
  Object.entries(PACKET_TYPE).map(([key, value]) => [value, key]),
);
