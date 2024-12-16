import PlayerGameData from '../../classes/models/playerGameData.class.js'; // eslint-disable-line
import Unit from '../../classes/models/unit.class.js'; // eslint-disable-line
import { UNIT_CLASS } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import validateTarget from '../../utils/unit/validationTarget.js';

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

    const healerUnit = validateHealerUnit(userGameData, unitId);

    const targetUnit = getTargetUnit(userGameData, targetId);

    const healAmount = calculateHealAmount(healerUnit, targetUnit, initialHealAmount, timestamp);
    const afterHealHp = applyHealing(healerUnit, targetUnit, healAmount, timestamp);

    sendPacket(socket, PACKET_TYPE.HEAL_UNIT_RESPONSE, {
      unitId: targetId,
      unitHp: afterHealHp,
    });

    // 노티피케이션 전송
    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_HEAL_UNIT_NOTIFICATION, {
      unitId: targetId,
      unitHp: afterHealHp,
    });
  } catch (err) {
    handleErr(socket, err);
  }
};

/**
 * 힐러 유닛 검증
 * @param {PlayerGameData} userGameData
 * @param {int32} unitId
 * @returns {Unit}
 */
const validateHealerUnit = (userGameData, unitId) => {
  const healerUnit = userGameData.getUnit(unitId);
  if (!healerUnit) {
    throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, 'Healer unit not found');
  }

  if (healerUnit.getClass() !== UNIT_CLASS.HEALER) {
    throw new CustomErr(ERR_CODES.UNIT_CLASS_MISMATCH, 'Unit is not a healer class');
  }
  return healerUnit;
};

/**
 * 대상 유닛을 가져오고 검증
 * @param {PlayerGameData} userGameData
 * @param {int32} targetId
 * @returns {Unit}
 */
const getTargetUnit = (userGameData, targetId) => {
  const targetUnit = userGameData.getUnit(targetId);
  if (!targetUnit) {
    throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, 'Target unit not found');
  }
  return targetUnit;
};

/**
 * 힐 양 계산
 * @param {Unit} healerUnit
 * @param {Unit} targetUnit
 * @param {int32} initialHealAmount
 * @param {int64} timestamp
 * @returns {int32}
 */
const calculateHealAmount = (healerUnit, targetUnit, initialHealAmount, timestamp) => {
  if (!validateTarget(healerUnit, targetUnit, 'heal') || !healerUnit.isSkillAvailable(timestamp)) {
    return 0;
  }
  return initialHealAmount;
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
  healerUnit.resetLastSkillTime(timestamp); // 스킬 사용 시간 초기화
  const afterHealHp = targetUnit.applyHeal(healAmount);
  return afterHealHp;
};

export default healUnitRequest;
