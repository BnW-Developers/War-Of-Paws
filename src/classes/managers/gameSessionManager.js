import { uuid } from '../../utils/util/uuid.js';
import Game from '../models/game.class.js';

class GameSessionManager {
  constructor() {
    // 싱글톤
    if (GameSessionManager.instance) {
      return GameSessionManager.instance; // 기존 인스턴스 반환
    }

    // 새로운 인스턴스 생성
    GameSessionManager.instance = this;

    // 게임 세션 목록 초기화
    this.gameSessions = new Map();
  }

  addGameSession() {
    const gameId = uuid(); // 게임 ID 생성
    const gameSession = new Game(gameId); // 게임 세션 생성
    this.gameSessions.set(gameId, gameSession); // 세션 등록
    return gameSession; // 생성된 게임 세션 반환
  }

  // gameId에 해당하는 세션이 있으면 삭제하고 성공 여부 반환
  removeGameSession(gameId) {
    return this.gameSessions.delete(gameId);
  }

  // gameId에 해당하는 게임 세션 반환 (없으면 null)
  getGameSessionByGameId(gameId) {
    return this.gameSessions.get(gameId) || null;
  }
}

const gameSessionManager = new GameSessionManager();
Object.freeze(gameSessionManager); // 인스턴스 변경 방지

export default gameSessionManager;
