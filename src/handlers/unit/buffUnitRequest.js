import { UNIT_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import validateTarget from '../../utils/unit/validationTarget.js';

/**
 * 클라이언트로부터 버프 요청을 처리하고, 대상 유닛에 버프를 적용한 뒤 응답 및 알림을 전송합니다.
 *
 * @param {Object} socket - 버프 요청을 보낸 플레이어의 소켓 객체.
 * @param {string} payload.unitId - 버프를 시도하는 유닛의 ID.
 * @param {number} payload.timestamp - 버프 요청이 발생한 타임스탬프.
 * @param {string[]} payload.targetIds - 버프 대상 유닛들의 ID 배열.
 * @param {number} payload.buffAmount - 버프 효과의 크기.
 * @param {number} payload.buffDuration - 버프 지속 시간(밀리초).
 */
const buffUnitRequest = (socket, payload) => {
  try {
    const {
      unitId,
      timestamp,
      targetIds,
      buffAmount: initialBuffAmount,
      buffDuration: initialBuffDuration,
    } = payload;

    let buffAmount = initialBuffAmount;
    let buffDuration = initialBuffDuration;

    const { userGameData, opponentSocket } = checkSessionInfo(socket);

    const bufferUnit = userGameData.getUnit(unitId);
    if (!bufferUnit) {
      throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, 'Unit not found');
    }

    if (bufferUnit.getType() !== UNIT_TYPE.BUFFER) {
      throw new Error('Unit Type Error');
    }

    const affectedUnits = [];

    if (bufferUnit.isSkillAvailable(timestamp)) {
      for (const targetId of targetIds) {
        const targetUnit = userGameData.getUnit(targetId);

        if (!validateTarget(bufferUnit, targetUnit) || targetUnit.isBuffed()) continue;

        targetUnit.applyBuff(buffAmount, buffDuration);
        affectedUnits.push(targetId);
      }
      bufferUnit.resetLastSkillTime(timestamp);
    }

    sendPacket(socket, PACKET_TYPE.BUFF_UNIT_RESPONSE, {
      unitId,
      targetIds: affectedUnits,
      buffAmount,
      buffDuration,
    });

    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_BUFF_UNIT_NOTIFICATION, {
      unitId,
      targetIds: affectedUnits,
      buffAmount,
      buffDuration,
    });
  } catch (err) {
    handleErr(socket, err);
  }
};

export default buffUnitRequest;
