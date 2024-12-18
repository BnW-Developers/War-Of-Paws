import { PACKET_TYPE } from '../../constants/header.js';
import logger from '../../utils/log/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import { handleErr } from './../../utils/error/handlerErr.js';

/**
 * 성채 공격 처리
 * @param {net.Socket} socket
 * @param {{ unitId: int32}} payload
 */
const attackBaseRequest = (socket, payload) => {
  try {
    const { unitId } = payload;
    const timestamp = Date.now();

    const { userGameData, opponentSocket, gameSession } = checkSessionInfo(socket);

    const unit = userGameData.getUnit(unitId);
    if (!unit) {
      logger.error('유닛 정보를 찾을 수 없습니다.');
      sendPacket(socket, PACKET_TYPE.ATTACK_BASE_RESPONSE, { unitId, success: false });
      return;
    }

    // 쿨타임 검증
    if (unit.isAttackOnCooldown(timestamp)) {
      sendPacket(socket, PACKET_TYPE.ATTACK_BASE_RESPONSE, { unitId, success: false });
      return;
    }

    unit.resetLastAttackTime(timestamp);

    if (unit.isTargetOutOfRange(unit.getOpponentBaseLocation())) {
      sendPacket(socket, PACKET_TYPE.ATTACK_BASE_RESPONSE, { unitId, success: false });
      return;
    }

    // 미점령 상태 성채 공격은 가능할 수 없음.
    const checkPointManager = gameSession.getCheckPointManager();
    if (!checkPointManager.getCheckPointState(unitId)) {
      logger.error('체크포인트가 점령되지 않은 상태에서는 공격할 수 없습니다.');
      sendPacket(socket, PACKET_TYPE.ATTACK_BASE_RESPONSE, { unitId, success: false });
      return;
    }

    sendPacket(socket, PACKET_TYPE.ATTACK_BASE_RESPONSE, { unitId, success: true });
    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_ATTACK_BASE_NOTIFICATION, {
      unitId,
      success: true,
    });
  } catch (err) {
    handleErr(socket, err);
  }
};

export default attackBaseRequest;
