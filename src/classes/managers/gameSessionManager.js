import { recordGame } from '../../mysql/game/game.db.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/log/logger.js';
import { uuid } from '../../utils/util/uuid.js';
import Game from '../models/game.class.js';
import userSessionManager from './userSessionManager.js';

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
    logger.info(`Game session added gameId: ${gameId}`);
    return gameSession; // 생성된 게임 세션 반환
  }

  // gameId에 해당하는 세션이 있으면 삭제하고 성공 여부 반환
  removeGameSession(gameId) {
    logger.info(`Game session removed gameId: ${gameId}`);
    return this.gameSessions.delete(gameId);
  }

  handleGameCancel(data) {
    try {
      logger.info(`Game canceled gameId: ${data.gameId}`);
      this.removeGameSession(data.gameId);
    } catch (err) {
      err.message = 'handleGameCancel error: ' + err.message;
      handleErr(null, err);
    }
  }

  async handleGameEnd(data) {
    try {
      logger.info(`Game ended gameId: ${data.gameId}`);
      await recordGame(data.catUserId, data.dogUserId, data.winTeam);
      this.removeGameSession(data.gameId);
    } catch (err) {
      err.message = 'handleGameEnd error: ' + err.message;
      handleErr(null, err);
    }
  }

  // gameId에 해당하는 게임 세션 반환 (없으면 null)
  getGameSessionByGameId(gameId) {
    return this.gameSessions.get(gameId) || null;
  }

  /**
   * socket에 해당하는 유저가 플레이중인 게임세션을 반환
   * @param {net.Socket} socket
   * @returns {Game}
   */
  getGameSessionBySocket(socket) {
    const user = userSessionManager.getUserBySocket(socket);
    if (!user) return null;
    const gameId = user.getCurrentGameId();
    const gameSession = this.getGameSessionByGameId(gameId);
    return gameSession;
  }
  getGameSessionSize() {
    return this.gameSessions.size;
  }
}

const gameSessionManager = new GameSessionManager();
Object.freeze(gameSessionManager); // 인스턴스 변경 방지

export default gameSessionManager;
