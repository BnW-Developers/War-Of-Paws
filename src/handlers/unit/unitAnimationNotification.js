import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

/**
 * 클라이언트로부터 유닛 애니메이션 알림을 처리하고, 상대방에게 알림을 전송
 * @param {net.Socket} socket
 * @param {{ unitId: int32, animationId: int32 }} payload
 */
const unitAnimationNotification = (socket, payload) => {
  try {
    const { unitId, animationId } = payload;

    const { userGameData, opponentSocket } = checkSessionInfo(socket);

    const unit = userGameData.getUnit(unitId);
    if (!unit) {
      throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, `Unit with ID ${unitId} not found`);
    }

    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_UNIT_ANIMATION_NOTIFICATION, {
      unitId,
      animationId,
    });
  } catch (err) {
    handleErr(socket, err);
  }
};

export default unitAnimationNotification;
