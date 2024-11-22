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
