import { recordGame } from '../../mysql/game/game.db.js';
import redisClient from '../../redis/redisClient.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import logger from '../../utils/logger.js';
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

    this.initSubscriber();
  }

  initSubscriber() {
    const subscriber = redisClient.duplicate();

    subscriber.subscribe('game:cancel', 'game:end');

    subscriber.on('message', async (channel, message) => {
      const data = JSON.parse(message);

      switch (channel) {
        case 'game:cancel':
          this.handleGameCancel(data);
          break;
        case 'game:end':
          await this.handleGameEnd(data);
          break;
      }
    });
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
    logger.info(`Game cenceled gameId: ${data.gameId}`);
    this.removeGameSession(data.gameId);
  }

  async handleGameEnd(data) {
    logger.info(`Game ended gameId: ${data.gameId}`);
    await recordGame(data.catUserId, data.dogUserId, data.winTeam);
    this.removeGameSession(data.gameId);
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
    if (!user)
      throw new CustomErr(
        ERR_CODES.USER_NOT_FOUND,
        '유저 세션에서 유저 정보를 가져오는데 실패했습니다.',
      );
    const gameId = user.getCurrentGameId();
    const gameSession = this.getGameSessionByGameId(gameId);
    return gameSession;
  }

  getAllPlayerGameDataBySocket(socket) {
    // 각각 메서드에서 문제가 있을 경우 에러를 던져주기 때문에 그대로 흘림.
    const gameSession = this.getGameSessionBySocket(socket);
    return gameSession.getAllPlayerGameDataBySocket(socket);
  }
}

const gameSessionManager = new GameSessionManager();
Object.freeze(gameSessionManager); // 인스턴스 변경 방지

export default gameSessionManager;
