import userSessionManager from '../classes/managers/userSessionManager.js';
import matchingSystem from '../matchmakingQueue/matchingSystem.js';
import { handleErr } from '../utils/error/handlerErr.js';

export const onEnd = (socket) => () => {
  try {
    const user = userSessionManager.getUserBySocket(socket);
    if (user) {
      // 유저 세션에서 해당 유저 삭제
      // 유저가 매칭을 돌리고 있을 때 접속을 종료했다면
      if (user.getIsMatchmaking()) {
        // 매칭 큐에서 유저 삭제
        matchingSystem.removeUser(user.getUserId(), user.getCurrentSpecies());
      }

      if (user.getCurrentGameId()) {
        // TODO 게임 중 접속 종료 시 처리 추가
      }
      userSessionManager.removeUser(user.getUserId());
    }
  } catch (err) {
    handleErr(null, err);
  }
};
