export const MAX_PLAYERS = 2;
export const GAME_START_TIMEOUT = 30 * 1000; // gameStartRequest를 30초동안 기다림
export const GAME_START_REQUEST_REQUIRE = 2; // 게임 시작을 위해 필요한 플레이어 수
export const INITIAL_MINERAL = 200;
export const INITIAL_MINERAL_RATE = 10; // 10원
export const OCCUR_ONE_CHECKPOINT_MINERAL_RATE = 15;
export const OCCUR_TWO_CHECKPOINT_MINERAL_RATE = 20;
export const MINERAL_SYNC_INTERVAL = 2000; // 2초당
export const INITIAL_BASE_HP = 1000;
export const ATTACK_COOLDOWN_ERROR_MARGIN = 200;
export const SKILL_COOLDOWN_ERROR_MARGIN = 200;
export const ATTACK_RANGE_ERROR_MARGIN = 1.05; // 5%
export const SPEED_MARGIN_OF_ERROR = 1.05; // 속도 허용 오차배율
export const MAX_CARDS_COUNT = 8;

export const INITIAL_UNIT_ROTATION = Object.freeze({ up: 0, down: 180 });

// 카드 뽑기 버튼 설정
export const BUTTON_CONFIG = Object.freeze({
  0: { cost: 20, probabilities: { 1: 0.65, 2: 0.25, 3: 0.1 } }, // 낮은 등급
  1: { cost: 40, probabilities: { 1: 0.5, 2: 0.35, 3: 0.15 } }, // 중간 등급
  2: { cost: 80, probabilities: { 1: 0.35, 2: 0.4, 3: 0.25 } }, // 높은 등급
});
