import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

const exitCheckpointNotification = (socket, payload) => {
  const { unitId } = payload;

  try {
    const { gameSession, userGameData } = checkSessionInfo(socket);

    const CheckPointManager = gameSession.getCheckPointManager();
    if (!CheckPointManager) {
      throw new CustomErr(ERR_CODES.CHECKPOINT_NOT_FOUND, 'CheckPointManager is not found');
    }
    // 중복된 유닛아이디로 점령진입 패킷을 시도할 경우 에러처리
    if (!CheckPointManager.isExistUnit(unitId))
      throw new CustomErr(ERR_CODES.DUPLICATE_UNIT_IN_CHECKPOINT, '점령지에 없는 유닛입니다.');

    if (!userGameData.getUnit(unitId))
      throw new CustomErr(ERR_CODES.UNOWNED_UNIT, '보유하지 않은 유닛입니다.');
    // 메서드 실행
    CheckPointManager.removeUnit(unitId);
  } catch (err) {
    handleErr(socket, err);
  }
};

export default exitCheckpointNotification;
