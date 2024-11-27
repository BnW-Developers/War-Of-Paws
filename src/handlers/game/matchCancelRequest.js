import matchingSystem from '../../matchmakingQueue/matchingSystem.js';
import logger from '../../utils/logger.js';
import userSessionManager from '../../classes/managers/userSessionManager.js';
import { handleErr } from '../../utils/error/handlerErr.js';

// eslint-disable-next-line no-unused-vars
const matchCancelRequest = async (socket, payload) => {
  try {
    const user = userSessionManager.getUserBySocket(socket);
    if (!user) {
      throw new Error('유저를 찾을 수 없습니다');
    }
    matchingSystem.removeUser(user.getUserId(), user.getCurrentSpecies());
    logger.info(`match Cancel request id: ${user.getUserId()}`);
  } catch (err) {
    handleErr(socket, err);
  }
};

export default matchCancelRequest;
