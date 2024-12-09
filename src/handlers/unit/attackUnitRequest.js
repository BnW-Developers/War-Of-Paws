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
 * @param {Object} socket - 공격을 시도하는 플레이어의 소켓 객체.
 * @param {string} payload.unitId - 공격을 시도하는 유닛의 ID.
 * @param {number} payload.timestamp - 공격 요청이 발생한 타임스탬프.
 * @param {string[]} payload.opponentUnitIds - 공격 대상 유닛들의 ID 배열.
 */
const attackUnitRequest = (socket, payload) => {
  try {
    const { unitId, timestamp, opponentUnitIds } = payload;

    const { userGameData, opponentGameData, opponentSocket, gameSession } =
      checkSessionInfo(socket);

    const attackUnit = userGameData.getUnit(unitId);
    if (!attackUnit) {
      throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, 'Unit not found');
    }

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

const processingDeath = (unit, gameData, unitId, session, notifications) => {
  if (unit.isDead()) {
    logger.info(`Unit ${unitId} is already dead.`);
    return false;
  }

  unit.markAsDead();
  const checkPointManager = session.getCheckPointManager();
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

export default attackUnitRequest;
