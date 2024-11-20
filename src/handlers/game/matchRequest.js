import matchingSystem from '../../matchmakingQueue/matchingSystem.js';
import userSessionManager from './../../classes/managers/userSessionManager.js';
import { handleErr } from './../../utils/error/handlerErr.js';

const matchRequest = async (socket, payload) => {
  try {
    const { species } = payload;
    console.log('species: ', species);
    const user = userSessionManager.getUserBySocket(socket);
    if (!user) {
      console.error('유저 어디감');
      throw new Error('on matchRequest 유저가 없습니다');
    }

    const result = await matchingSystem.addQueue(user.getUserId(), species);
    if (result.success) {
      console.log('add queue result: ', result.message);
    } else {
      console.error('add queue result: failed');
    }
  } catch (err) {
    handleErr(socket, err);
  }
};

export default matchRequest;
