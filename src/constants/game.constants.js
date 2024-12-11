// 플레이어 수
export const GAME_START_REQUEST_REQUIRE = 2; // 게임 시작을 위해 필요한 플레이어 수
export const MAX_PLAYERS = 2;

// 매칭 및 게임시작
export const GAME_START_TIMEOUT = 30 * 1000; // gameStartRequest를 30초동안 기다림

// 초기값
export const INITIAL_BASE_HP = 1000;
export const INITIAL_MINERAL = 200;
export const INITIAL_MINERAL_RATE = 10; // 10원
export const INITIAL_UNIT_ROTATION = Object.freeze({ up: 0, down: 180 });

// 자원
export const OCCUPY_ONE_CHECKPOINT_MINERAL_RATE = 15;
export const OCCUPY_TWO_CHECKPOINT_MINERAL_RATE = 20;
export const MINERAL_SYNC_INTERVAL = 2000; // 2초당

// 쿨타임 허용 오차
export const ATTACK_COOLDOWN_ERROR_MARGIN = 200; // 0.2초
export const SKILL_COOLDOWN_ERROR_MARGIN = 200; // 0.2초
export const SPELL_COOLDOWN_ERROR_MARGIN = 200; // 0.2초

// 사정거리 허용 오차
export const RANGE_ERROR_MARGIN = 1.05; // 5%

// 속도 허용 오차
export const SPEED_MARGIN_OF_ERROR = 1.05; // 5%
