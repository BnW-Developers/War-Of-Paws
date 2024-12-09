import gameSessionManager from '../classes/managers/gameSessionManager.js';
import userSessionManager from '../classes/managers/userSessionManager.js';
import { handleErr } from '../utils/error/handlerErr.js';
import logger from '../utils/logger.js';

export const onError = (socket) => (err) => {
  try {
    logger.error(`Socket Error:, ${err?.message}`);
    const user = userSessionManager.getUserBySocket(socket);
    if (user) {
      if (user.getCurrentGameId()) {
        // 게임 중 접속 종료 시 처리
        const gameSession = gameSessionManager.getGameSessionByGameId(user.getCurrentGameId());
        if (gameSession) {
          gameSession.endGameByDisconnect(user.getUserId());
        }
      }
      userSessionManager.removeUser(user.getUserId());
    }
  } catch (err) {
    handleErr(null, err);
  }
};
