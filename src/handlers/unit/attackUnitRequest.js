import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import validateTarget from '../../utils/unit/validationTarget.js';

/**
 * 클라이언트로부터 공격 요청을 처리하고, 공격 로직을 수행한 뒤 공격 및 사망 응답을 전송합니다.
 *
 * @param {Object} socket - 공격을 시도하는 플레이어의 소켓 객체
 * @param {string} payload.unitId - 공격을 시도하는 유닛의 ID
 * @param {number} payload.timestamp - 공격 요청이 발생한 타임스탬프
 * @param {string[]} payload.opponentUnitIds - 공격 대상 유닛들의 ID 배열
 */
const attackUnitRequest = (socket, payload) => {
  try {
    const { unitId, timestamp, opponentUnitIds } = payload;

    const { userGameData, opponentGameData, opponentSocket, gameSession } =
      checkSessionInfo(socket);

    const attackUnit = validateAttackUnit(userGameData, unitId);

    const { opponentUnitInfos, deathNotifications } = processAttack(
      attackUnit,
      opponentUnitIds,
      opponentGameData,
      timestamp,
      gameSession,
    );

    sendPacket(socket, PACKET_TYPE.ATTACK_UNIT_RESPONSE, {
      unitInfos: opponentUnitInfos,
    });

    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_UNIT_ATTACK_NOTIFICATION, {
      unitInfos: opponentUnitInfos,
    });

    sendDeathNotifications(socket, opponentSocket, deathNotifications);
  } catch (err) {
    handleErr(socket, err);
  }
};

/**
 * 공격 유닛 검증 및 반환
 * @param {Object} userGameData - 사용자 게임 데이터
 * @param {string} unitId - 공격을 시도하는 유닛의 ID
 * @returns {Object} - 검증된 공격 유닛
 * @throws {CustomErr} - 유닛이 없거나 유효하지 않은 경우
 */
const validateAttackUnit = (userGameData, unitId) => {
  const unit = userGameData.getUnit(unitId);
  if (!unit) {
    throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, 'Unit not found');
  }
  return unit;
};

/**
 * 사망 처리
 * @param {Object} unit - 대상 유닛
 * @param {Object} gameData - 게임 데이터
 * @param {string} unitId - 유닛의 ID
 * @param {Object} gameSession - 게임 세션
 * @param {string[]} notifications - 사망 알림 배열
 */
const processingDeath = (unit, gameData, unitId, gameSession, notifications) => {
  if (unit.isDead()) {
    logger.info(`Unit ${unitId} is already dead.`);
    return false;
  }

  unit.markAsDead();
  const checkPointManager = gameSession.getCheckPointManager();
  if (checkPointManager.isExistUnit(unitId)) {
    checkPointManager.removeUnit(unitId);
  }

  gameData.removeUnit(unitId);
  notifications.push(unitId);
  return true;
};

const sendDeathNotifications = (socket, opponentSocket, notifications) => {
  if (notifications.length > 0) {
    sendPacket(socket, PACKET_TYPE.UNIT_DEATH_NOTIFICATION, { unitIds: notifications });
    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_UNIT_DEATH_NOTIFICATION, {
      unitIds: notifications,
    });
  }
};

/**
 * 공격 처리
 * @param {Object} attackUnit - 공격 유닛
 * @param {string[]} opponentUnitIds - 공격 대상 유닛들의 ID 배열
 * @param {Object} opponentGameData - 상대방의 게임 데이터
 * @param {number} timestamp - 공격 요청이 발생한 타임스탬프
 * @param {Object} gameSession - 현재 게임 세션
 * @returns {Object} - 공격 결과 및 사망 알림 정보
 */
const processAttack = (attackUnit, opponentUnitIds, opponentGameData, timestamp, gameSession) => {
  const opponentUnitInfos = [];
  const deathNotifications = [];

  if (attackUnit.isAttackAvailable(timestamp)) {
    for (const opponentUnitId of opponentUnitIds) {
      const targetUnit = opponentGameData.getUnit(opponentUnitId);

      if (!validateTarget(attackUnit, targetUnit)) continue;

      const resultHp = targetUnit.applyDamage(attackUnit.getAttackPower());
      attackUnit.resetLastAttackTime(timestamp);

      if (targetUnit.getHp() <= 0) {
        processingDeath(
          targetUnit,
          opponentGameData,
          opponentUnitId,
          gameSession,
          deathNotifications,
        );
      }

      opponentUnitInfos.push({
        unitId: opponentUnitId,
        unitHp: resultHp,
      });
    }
  }

  return { opponentUnitInfos, deathNotifications };
};

export default attackUnitRequest;
