import { UNIT_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import validateTarget from '../../utils/unit/validationTarget.js';

/**
 * 클라이언트로부터 버프 요청을 처리하고, 대상 유닛에 버프를 적용한 뒤 응답을 전송합니다
 *
 * @param {Object} socket - 버프 요청을 보낸 플레이어의 소켓 객체
 * @param {string} payload.unitId - 버프를 시도하는 유닛의 ID
 * @param {number} payload.timestamp - 버프 요청이 발생한 타임스탬프
 * @param {string[]} payload.targetIds - 버프 대상 유닛들의 ID 배열
 * @param {number} payload.buffAmount - 버프 효과의 크기
 * @param {number} payload.buffDuration - 버프 지속 시간
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

    const bufferUnit = getValidatedBufferUnit(userGameData, unitId);

    const affectedUnits = applyBuffToTargets(
      bufferUnit,
      targetIds,
      userGameData,
      buffAmount,
      buffDuration,
      timestamp,
    );

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

/**
 * 버프 유닛 검증 및 반환.
 *
 * @param {Object} userGameData - 사용자 게임 데이터
 * @param {string} unitId - 버프를 시도하는 유닛의 ID
 * @returns {Object} - 검증된 버프 유닛
 */
const getValidatedBufferUnit = (userGameData, unitId) => {
  const bufferUnit = userGameData.getUnit(unitId);
  if (!bufferUnit) {
    throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, 'Buffer unit not found');
  }
  if (bufferUnit.getType() !== UNIT_TYPE.BUFFER) {
    throw new CustomErr(ERR_CODES.UNIT_TYPE_MISMATCH, 'Unit is not a buffer type');
  }
  return bufferUnit;
};

/**
 * 대상 유닛들에게 버프를 적용
 * @param {Object} bufferUnit - 버프를 시도하는 유닛
 * @param {string[]} targetIds - 버프 대상 유닛들의 ID 배열
 * @param {Object} userGameData - 사용자 게임 데이터
 * @param {number} buffAmount - 버프 효과의 크기
 * @param {number} buffDuration - 버프 지속 시간
 * @param {number} timestamp - 버프 요청이 발생한 타임스탬프
 * @returns {string[]} - 버프가 적용된 대상 유닛들의 ID 배열
 */
const applyBuffToTargets = (
  bufferUnit,
  targetIds,
  userGameData,
  buffAmount,
  buffDuration,
  timestamp,
) => {
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

  return affectedUnits;
};

export default buffUnitRequest;
