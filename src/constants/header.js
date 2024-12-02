export const PACKET_TYPE_LENGTH = 2;
export const PACKET_VERSION_LENGTH = 1;
export const PACKET_SEQUENCE = 4;
export const PACKET_PAYLOAD_LENGTH = 2;

// TODO: S2C,C2S 넣을건지 확인 후 수정 필요.

export const PACKET_TYPE = Object.freeze({
  // 에러
  ERROR_NOTIFICATION: 1,

  // 회원가입 및 로그인
  REGISTER_REQUEST: 2,
  REGISTER_RESPONSE: 3,
  LOGIN_REQUEST: 4,
  LOGIN_RESPONSE: 5,
  GOOGLE_LOGIN_REQUEST: 6,
  GOOGLE_LOGIN_RESPONSE: 7,

  // 매칭
  MATCH_REQUEST: 8,
  MATCH_NOTIFICATION: 9,
  MATCH_CANCEL_REQUEST: 10,

  // 게임 시작
  GAME_START_REQUEST: 11,
  GAME_START_NOTIFICATION: 12,

  // 건물 구매
  PURCHASE_BUILDING_REQUEST: 13,
  PURCHASE_BUILDING_RESPONSE: 14,
  ADD_ENEMY_BUILDING_NOTIFICATION: 15,

  // 유닛 생성
  SPAWN_UNIT_REQUEST: 16,
  SPAWN_UNIT_RESPONSE: 17,
  SPAWN_ENEMY_UNIT_NOTIFICATION: 18,

  // 유닛 공격
  ATTACK_UNIT_REQUEST: 19,
  ATTACK_UNIT_RESPONSE: 20,
  ENEMY_UNIT_ATTACK_NOTIFICATION: 21,

  // 유닛 사망
  UNIT_DEATH_NOTIFICATION: 22,
  ENEMY_UNIT_DEATH_NOTIFICATION: 23,

  // 체크포인트 점령
  ENTER_CHECKPOINT_NOTIFICATION: 24,
  TRY_OCCUPATION_NOTIFICATION: 25,
  PAUSE_OCCUPATION_NOTIFICATION: 26,
  OCCUPATION_TIMER_RESET_NOTIFICATION: 27,
  OCCUPATION_SUCCESS_NOTIFICATION: 28,

  // 성채공격
  ATTACK_BASE_REQUEST: 29,
  ATTACK_BASE_RESPONSE: 30,
  BASE_ATTACKED_NOTIFICATION: 31,

  // 게임 종료
  GAME_OVER_NOTIFICATION: 32,
  GAME_END_NOTIFICATION: 33,

  // 상태 동기화
  LOCATION_NOTIFICATION: 34,
  LOCATION_SYNC_NOTIFICATION: 35,
  MINERAL_SYNC_NOTIFICATION: 36,

  // Heal 관련
  HEAL_UNIT_REQUEST: 37,
  HEAL_UNIT_RESPONSE: 38,
  ENEMY_HEAL_UNIT_NOTIFICATION: 39,

  // Buff 관련
  BUFF_UNIT_REQUEST: 40,
  BUFF_UNIT_RESPONSE: 41,
  ENEMY_BUFF_UNIT_NOTIFICATION: 42,
});

export const PACKET_TYPE_REVERSED = Object.fromEntries(
  Object.entries(PACKET_TYPE).map(([key, value]) => [value, key]),
);
