import { PACKET_TYPE } from '../../constants/header.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/log/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import validateTarget from '../../utils/unit/validationTarget.js';

/**
 * 클라이언트로부터 공격 요청을 처리하고, 공격 로직을 수행한 뒤 결과를 응답으로 전송
 * @param {net.Socket} socket
 * @param {{ attackingUnitId: int32, targetUnitIds: Array<int32> }} payload
 */
const attackUnitRequest = (socket, payload) => {
  try {
    const { attackingUnitId, targetUnitIds } = payload;
    const timestamp = Date.now();
    const validatedTargetUnits = [];

    const { userGameData, opponentGameData, opponentSocket } = checkSessionInfo(socket);

    const attackingUnit = userGameData.getUnit(attackingUnitId);
    if (!attackingUnit) {
      logger.error('Unit not found');
      sendPacket(socket, PACKET_TYPE.ATTACK_UNIT_NOTIFICATION, {
        attackingUnitId,
        targetUnitIds: validatedTargetUnits,
        success: false,
      });
      return;
    }

    if (attackingUnit.isAttackOnCooldown(timestamp)) {
      sendPacket(socket, PACKET_TYPE.ATTACK_UNIT_NOTIFICATION, {
        attackingUnitId,
        targetUnitIds: validatedTargetUnits,
        success: false,
      });
      return;
    }

    attackingUnit.resetLastAttackTime(timestamp);

    for (const targetUnitId of targetUnitIds) {
      const targetUnit = opponentGameData.getUnit(targetUnitId);

      if (!validateTarget(attackingUnit, targetUnit, 'attack')) {
        continue;
      }

      validatedTargetUnits.push(targetUnitId);
    }

    // 검증 실패로 타겟 유닛이 없음
    if (validatedTargetUnits.length === 0) {
      sendPacket(socket, PACKET_TYPE.ATTACK_UNIT_NOTIFICATION, {
        attackingUnitId,
        targetUnitIds: validatedTargetUnits,
        success: false,
      });
      return;
    }

    // validatedTargetUnits 배열 크기만큼 투사체 생성
    attackingUnit.addProjectile(validatedTargetUnits.length);

    sendPacket(socket, PACKET_TYPE.ATTACK_UNIT_NOTIFICATION, {
      attackingUnitId,
      targetUnitIds: validatedTargetUnits,
      success: true,
    });

    sendPacket(opponentSocket, PACKET_TYPE.ATTACK_UNIT_NOTIFICATION, {
      attackingUnitId,
      targetUnitIds: validatedTargetUnits,
      success: true,
    });
  } catch (err) {
    handleErr(socket, err);
  }
};

export default attackUnitRequest;
