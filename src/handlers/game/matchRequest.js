import matchingSystem from '../../matchmakingQueue/matchingSystem.js';
import logger from '../../utils/logger.js';
import userSessionManager from './../../classes/managers/userSessionManager.js';
import { handleErr } from './../../utils/error/handlerErr.js';

const matchRequest = async (socket, payload) => {
  try {
    const { species } = payload;
    const user = userSessionManager.getUserBySocket(socket);
    if (!user) {
      throw new Error('유저를 찾을 수 없습니다');
    }
    logger.info(`match request id: ${user.getUserId()}`);

    // 유저가 매칭을 돌리고 있는데 또 매칭 요청을 보냈다면
    if (user.getIsMatchmaking()) {
      // 매칭 큐에서 유저 삭제
      await matchingSystem.removeUser(user.getUserId(), user.getCurrentSpecies());
    }

    const result = await matchingSystem.addQueue(user, species);
    if (result.success) {
      logger.info(`user ${user.getUserId()} add queue result: ${result.message}`);
    } else {
      throw new Error(`user ${user.getUserId()} add queue result: failed`);
    }
  } catch (err) {
    handleErr(socket, err);
  }
};

export default matchRequest;
