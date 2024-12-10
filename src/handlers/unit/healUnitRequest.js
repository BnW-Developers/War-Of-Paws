import { UNIT_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import validateTarget from '../../utils/unit/validationTarget.js';

/**
 * 클라이언트로부터 힐 요청을 처리하고, 회복된 체력을 응답으로 전송합니다
 * @param {Object} socket - 힐 요청을 보낸 플레이어의 소켓 객체
 * @param {string} payload.unitId - 힐을 시도하는 유닛의 ID
 * @param {number} payload.timestamp - 힐 요청이 발생한 타임스탬프
 * @param {string} payload.targetId - 힐을 받을 대상 유닛의 ID
 * @param {number} payload.healAmount - 회복할 체력량
 */
const healUnitRequest = (socket, payload) => {
  try {
    const { unitId, timestamp, targetId, healAmount: initialHealAmount } = payload;
    const { userGameData, opponentSocket } = checkSessionInfo(socket);

    const healerUnit = validateHealerUnit(userGameData, unitId);

    const targetUnit = getTargetUnit(userGameData, targetId);

    const healAmount = calculateHealAmount(healerUnit, targetUnit, timestamp, initialHealAmount);
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
 * @param {Object} userGameData - 사용자 게임 데이터
 * @param {string} unitId - 힐을 시도하는 유닛의 ID
 * @returns {Object} - 검증된 힐러 유닛
 */
const validateHealerUnit = (userGameData, unitId) => {
  const healerUnit = userGameData.getUnit(unitId);
  if (!healerUnit) {
    throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, 'Healer unit not found');
  }

  if (healerUnit.getType() !== UNIT_TYPE.HEALER) {
    throw new CustomErr(ERR_CODES.UNIT_TYPE_MISMATCH, 'Unit is not a healer type');
  }
  return healerUnit;
};

/**
 * 대상 유닛을 가져오고 검증
 * @param {Object} userGameData - 사용자 게임 데이터
 * @param {string} targetId - 대상 유닛의 ID
 * @returns {Object} - 대상 유닛
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
 * @param {Object} healerUnit - 힐을 시도하는 유닛
 * @param {Object} targetUnit - 힐을 받을 대상 유닛
 * @param {number} timestamp - 힐 요청이 발생한 타임스탬프
 * @param {number} initialHealAmount - 회복할 체력량
 * @returns {number} - 최종적으로 적용할 힐 양
 */
const calculateHealAmount = (healerUnit, targetUnit, timestamp, initialHealAmount) => {
  if (!validateTarget(healerUnit, targetUnit) || !healerUnit.isSkillAvailable(timestamp)) {
    return 0;
  }
  return initialHealAmount;
};

/**
 * 힐 적용
 * @param {Object} healerUnit - 힐을 시도하는 유닛
 * @param {Object} targetUnit - 힐을 받을 대상 유닛
 * @param {number} healAmount - 적용할 힐 양
 * @param {number} timestamp - 힐 요청이 발생한 타임스탬프
 * @returns {number} - 힐 후 대상 유닛의 체력
 */
const applyHealing = (healerUnit, targetUnit, healAmount, timestamp) => {
  const afterHealHp = targetUnit.applyHeal(healAmount);
  healerUnit.resetLastSkillTime(timestamp); // 스킬 사용 시간 초기화
  return afterHealHp;
};

export default healUnitRequest;
