import PlayerGameData from '../../classes/models/playerGameData.class.js'; // eslint-disable-line
import Unit from '../../classes/models/unit.class.js'; // eslint-disable-line
import { UNIT_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import validateTarget from '../../utils/unit/validationTarget.js';

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

    const timestamp = Date.now();
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
 * 버프 유닛 검증 및 반환
 * @param {PlayerGameData} userGameData
 * @param {int32} unitId
 * @returns {Unit}
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
 * @param {Unit} bufferUnit
 * @param {Array<int32>} targetIds
 * @param {PlayerGameData} userGameData
 * @param {int32} buffAmount
 * @param {int32} buffDuration
 * @param {int64} timestamp
 * @returns {Array<int32>} // 버프 받은 유닛 배열
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
    bufferUnit.resetLastSkillTime(timestamp);
    for (const targetId of targetIds) {
      const targetUnit = userGameData.getUnit(targetId);

      if (!validateTarget(bufferUnit, targetUnit, 'buff') || targetUnit.isBuffed()) continue;

      targetUnit.applyBuff(buffAmount, buffDuration);
      affectedUnits.push(targetId);
    }
  }

  return affectedUnits;
};

export default buffUnitRequest;
