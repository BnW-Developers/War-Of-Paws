export const UNIT_TEST = Object.freeze({
  // LOCATION_SYNC
  LOCATION_BASIC: 0,
  ROTATION: 1,
  OUT_OF_BOUNDS_W: 2,
  OUT_OF_BOUNDS_N: 3,
  OUT_OF_BOUNDS_E: 4,
  OUT_OF_BOUNDS_S: 5,
  WRONG_SIDE: 6,
  TOO_FAST: 7,

  // DRAW_CARD
  DRAW_CARD: 100,
  EXCEED_MAX_SLOTS: 101,
  ELITE_CARD: 102,
  NO_SUPER_ELITE: 103,

  // 추가
});

/**
 * 유닛 테스트 스위치
 */
export const CURRENT_TEST = UNIT_TEST.EXCEED_MAX_SLOTS;

/**
 * 로그 스위치
 */
// 페이로드
export const TEST_LOG_ENABLED_PAYLOAD = false;

// 에러
export const TEST_LOG_ENABLED_ERROR = true;

// 매칭 & 게임시작
export const TEST_LOG_ENABLED_MATCH = true;
export const TEST_LOG_ENABLED_GAME_START = true;

// 동기화
export const TEST_LOG_ENABLED_LOCATION_SYNC = false;
export const TEST_LOG_ENABLED_MINERAL_SYNC = false;

// 카드 & 유닛소환
export const TEST_LOG_ENABLED_DRAW_CARD = true;
export const TEST_LOG_ENABLED_SPAWN_UNIT = true;

// 공격
export const TEST_LOG_ENABLED_ATTACK_BASE = true;

// 점령
export const TEST_LOG_ENABLED_CHECKPOINT = true;

// 게임종료
export const TEST_LOG_ENABLED_GAME_OVER = true;
