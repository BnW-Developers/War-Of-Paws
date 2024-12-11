import gameSessionManager from '../classes/managers/gameSessionManager.js';
import userSessionManager from '../classes/managers/userSessionManager.js';
import { PACKET_TYPE } from '../constants/header.js';
import { ERR_CODES } from '../utils/error/errCodes.js';
import { handleErr } from '../utils/error/handlerErr.js';
import logger from '../utils/logger.js';
import { sendPacket } from '../utils/packet/packetManager.js';

let errCount = 0;

export const onError = (socket) => (err) => {
  try {
    // 에러 카운트 증가
    errCount++;

    // 에러를 사용자에게 알림
    sendPacket(socket, PACKET_TYPE.ERROR_NOTIFICATION, {
      errorCode: ERR_CODES.SOCKET_ERR,
      message: '서버 연결에 문제가 발생했습니다. 다시 시도해주세요.',
    });

    const user = userSessionManager.getUserBySocket(socket);
    if (user && errCount <= 10) {
      const userId = user.getUserId();
      logger.error(`${userId} - Socket Error:, ${err?.message}`);
    } else {
      // 게임 세션 정리
      if (user.getCurrentGameId()) {
        const gameSession = gameSessionManager.getGameSessionByGameId(user.getCurrentGameId());
        if (gameSession) {
          gameSession.endGameByDisconnect(user.getUserId());
        }
      }
      // 유저세션 삭제
      userSessionManager.removeUser(user.getUserId());

      // 소켓 종료 확인
      if (!socket.destroyed) {
        const port = socket.remotePort;
        console.log(`${user.userId} - ${port}로 연결되었던 소켓 연결 해제됨`);
        socket.destroy();
      }
    }
  } catch (err) {
    handleErr(null, err);
  }
};
