import { UNIT_CLASS } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/log/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

/**
 * 클라이언트로부터 버프 요청을 처리하고, 대상 유닛에 버프를 적용한 뒤 응답을 전송
 * @param {net.socket} socket
 * @param {{ unitId: int32, targetIds: Array<int32>, buffAmount: int32, buffDuration: int32 }} payload
 */
const buffUnitRequest = (socket, payload) => {
  try {
    const {
      unitId,
      targetIds,
      buffAmount: initialBuffAmount,
      buffDuration: initialBuffDuration,
    } = payload;
    const { userGameData, opponentSocket } = checkSessionInfo(socket);

    const timestamp = Date.now();
    let buffAmount = initialBuffAmount;
    let buffDuration = initialBuffDuration;
    const affectedUnits = [];

    const bufferUnit = userGameData.getUnit(unitId);
    if (!bufferUnit) {
      throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, 'Buffer unit not found');
    }

    if (bufferUnit.getClass() !== UNIT_CLASS.BUFFER) {
      throw new CustomErr(ERR_CODES.UNIT_CLASS_MISMATCH, 'Unit is not a buffer class');
    }

    if (!bufferUnit.isSkillAvailable(timestamp)) {
      sendPacket(socket, PACKET_TYPE.BUFF_UNIT_NOTIFICATION, {
        unitIds: affectedUnits,
        buffAmount,
        buffDuration,
        success: false,
      });
      return;
    }

    // 대상 유닛들에 버프 적용
    for (const targetId of targetIds) {
      const targetUnit = userGameData.getUnit(targetId);

      if (!targetUnit) {
        logger.warn(`Target unit not found: ${targetId}`);
        continue;
      }

      // 너무 먼 사거리 공격 방지
      if (bufferUnit.isTargetOutOfRange(targetUnit.getPosition())) {
        continue;
      }

      // 같은 라인이여야 공격 가능
      if (bufferUnit.direction !== targetUnit.direction) {
        logger.warn(`Target is not on the same line.", ${unitId} to ${targetId}`);
        continue;
      }

      if (targetUnit.isBuffed()) {
        logger.warn(`Target unit is already buffed: ${targetId}`);
        continue;
      }

      // 버프 적용
      targetUnit.applyBuff(buffAmount, buffDuration);
      affectedUnits.push(targetId);
    }

    if (affectedUnits.length === 0) {
      sendPacket(socket, PACKET_TYPE.BUFF_UNIT_NOTIFICATION, {
        unitIds: affectedUnits,
        buffAmount,
        buffDuration,
        success: false,
      });
      return;
    }

    // 스킬 사용 시간 초기화
    bufferUnit.resetLastSkillTime(timestamp);

    sendPacket(socket, PACKET_TYPE.BUFF_UNIT_NOTIFICATION, {
      unitIds: affectedUnits,
      buffAmount,
      buffDuration,
      success: true,
    });

    sendPacket(opponentSocket, PACKET_TYPE.BUFF_UNIT_NOTIFICATION, {
      unitIds: affectedUnits,
      buffAmount,
      buffDuration,
      success: true,
    });
  } catch (err) {
    handleErr(socket, err);
  }
};

export default buffUnitRequest;
