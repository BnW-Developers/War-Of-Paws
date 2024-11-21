export const GAME_CONSTANTS = {
  MAX_PLAYERS: 2,
  GAME_START_TIMEOUT: 30 * 1000, // gameStartRequest를 30초동안 기다림
  GAME_START_REQUEST_REQUIRE: 2, // 게임 시작을 위해 필요한 플레이어 수
};

Object.freeze(GAME_CONSTANTS);
