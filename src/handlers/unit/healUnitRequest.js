import Unit from '../../classes/models/unit.class.js'; // eslint-disable-line
import { UNIT_CLASS } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/log/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

/**
 * 클라이언트로부터 힐 요청을 처리하고, 회복된 체력을 응답으로 전송
 * @param {net.Socket} socket
 * @param {{ unitId: int32, targetId: int32, healAmount: int32 }} payload
 */
const healUnitRequest = (socket, payload) => {
  try {
    const { unitId, targetId, healAmount: initialHealAmount } = payload;
    const { userGameData, opponentSocket } = checkSessionInfo(socket);
    const timestamp = Date.now();
    let healAmount = initialHealAmount;

    const healerUnit = userGameData.getUnit(unitId);
    if (!healerUnit) {
      throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, 'Healer unit not found');
    }

    if (healerUnit.getClass() !== UNIT_CLASS.HEALER) {
      throw new CustomErr(ERR_CODES.UNIT_CLASS_MISMATCH, 'Unit is not a healer class');
    }

    const targetUnit = userGameData.getUnit(targetId);
    let beforeHealHp = targetUnit.getHp();

    // 대상 유닛이 존재하지 않는 경우
    if (!targetUnit) {
      logger.error(`Target unit not found. ${unitId}`);
      sendPacket(socket, PACKET_TYPE.HEAL_UNIT_NOTIFICATION, {
        unitId: targetId,
        unitHp: beforeHealHp,
        success: false,
      });
      return;
    }

    // 너무 먼 사거리 공격 방지
    if (healerUnit.isTargetOutOfRange(targetUnit.getPosition())) {
      sendPacket(socket, PACKET_TYPE.HEAL_UNIT_NOTIFICATION, {
        unitId: targetId,
        unitHp: beforeHealHp,
        success: false,
      });
      return;
    }

    // 같은 라인이여야 공격 가능
    if (healerUnit.direction !== targetUnit.direction) {
      logger.warn(`Target is not on the same line.", ${unitId} to ${targetId}`);
      sendPacket(socket, PACKET_TYPE.HEAL_UNIT_NOTIFICATION, {
        unitId: targetId,
        unitHp: beforeHealHp,
        success: false,
      });
      return;
    }

    if (!healerUnit.isSkillAvailable(timestamp)) {
      sendPacket(socket, PACKET_TYPE.HEAL_UNIT_NOTIFICATION, {
        unitId: targetId,
        unitHp: beforeHealHp,
        success: false,
      });
      return;
    }

    const afterHealHp = targetUnit.applyHeal(healAmount);
    healerUnit.resetLastSkillTime(timestamp); // 스킬 사용 시간 초기화

    sendPacket(socket, PACKET_TYPE.HEAL_UNIT_NOTIFICATION, {
      unitId: targetId,
      unitHp: afterHealHp,
      success: true,
    });

    // 노티피케이션 전송
    sendPacket(opponentSocket, PACKET_TYPE.HEAL_UNIT_NOTIFICATION, {
      unitId: targetId,
      unitHp: afterHealHp,
      success: true,
    });
  } catch (err) {
    handleErr(socket, err);
  }
};

/**
 * 힐 적용
 * @param {Unit} healerUnit
 * @param {Unit} targetUnit
 * @param {int32} healAmount
 * @param {int64} timestamp
 * @returns {int32}
 */
const applyHealing = (healerUnit, targetUnit, healAmount, timestamp) => {
  const afterHealHp = targetUnit.applyHeal(healAmount);
  return afterHealHp;
};

export default healUnitRequest;
