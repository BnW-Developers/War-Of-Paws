import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

const enterCheckpointNotification = (socket, payload) => {
  const { isTop, unitId } = payload;

  try {
    const { gameSession } = checkSessionInfo(socket);

    const CheckPointManager = gameSession.getCheckPointManager();
    if (!CheckPointManager) {
      throw new CustomErr(ERR_CODES.INVALID_GAME_STATE, 'CheckPointManager is not found');
    }
    //메서드 실행
    CheckPointManager.addUnit(socket, isTop, unitId);
  } catch (err) {
    handleErr(socket, err);
  }
};

export default enterCheckpointNotification;
