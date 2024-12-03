import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

const unitAnimationNotification = (socket, payload) => {
  try {
    const { unitId, animationId } = payload;

    const { userGameData, opponentSocket } = checkSessionInfo(socket);

    const unit = userGameData.getUnit(unitId);
    if (!unit) {
      throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, `Unit with ID ${unitId} not found`);
    }

    // animation id 검증 필요 ?
    // 서버내에 보유한 animation id중 하나인지

    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_UNIT_ANIMATION_NOTIFICATION, {
      unitId,
      animationId,
    });
  } catch (err) {
    handleErr(socket, err);
  }
};

export default unitAnimationNotification;
