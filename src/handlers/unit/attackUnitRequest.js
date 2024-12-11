import Game from '../../classes/models/game.class.js';
import PlayerGameData from '../../classes/models/playerGameData.class.js';
import Unit from '../../classes/models/unit.class.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/log/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import validateTarget from '../../utils/unit/validationTarget.js';

/**
 * 클라이언트로부터 공격 요청을 처리하고, 공격 로직을 수행한 뒤 결과를 응답으로 전송
 * @param {net.Socket} socket
 * @param {{ unitId: int32, timestamp: int64, opponentUnitIds: Array<int32> }} payload
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
      gameSession,
    );

    attackUnit.resetLastAttackTime(Date.now());

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
 * @param {PlayerGameData} userGameData
 * @param {int32} unitId
 * @returns {Unit}
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
 * @param {PlayerGameData} opponentGameData
 * @param {Unit} opponentUnit
 * @param {int32} opponentUnitId
 * @param {Game} gameSession
 * @param {Array<int32>} deathNotifications
 */
const processingDeath = (
  opponentGameData,
  opponentUnit,
  opponentUnitId,
  gameSession,
  deathNotifications,
) => {
  if (opponentUnit.isDead()) {
    logger.info(`Unit ${opponentUnitId} is already dead.`);
    return false;
  }

  opponentUnit.markAsDead();
  const checkPointManager = gameSession.getCheckPointManager();
  if (checkPointManager.isExistUnit(opponentUnitId)) {
    checkPointManager.removeUnit(opponentUnitId);
  }

  opponentGameData.removeUnit(opponentUnitId);
  deathNotifications.push(opponentUnitId);
  return true;
};

/**
 * 사망 알림 전송
 * @param {net.Socket} socket
 * @param {net.Socket} opponentSocket
 * @param {Array<int32>} deathNotifications
 */
const sendDeathNotifications = (socket, opponentSocket, deathNotifications) => {
  if (deathNotifications.length > 0) {
    sendPacket(socket, PACKET_TYPE.UNIT_DEATH_NOTIFICATION, { unitIds: deathNotifications });
    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_UNIT_DEATH_NOTIFICATION, {
      unitIds: deathNotifications,
    });
  }
};

/**
 * 공격 처리
 * @param {Unit} attackUnit
 * @param {Array<int32>} opponentUnitIds
 * @param {PlayerGameData} opponentGameData
 * @param {Game} gameSession
 * @returns {{ opponentUnitInfos: Array<{ unitId: number, unitHp: number }>, deathNotifications: Array<int32> }}
 */
const processAttack = (attackUnit, opponentUnitIds, opponentGameData, gameSession) => {
  const opponentUnitInfos = [];
  const deathNotifications = [];

  if (attackUnit.isAttackAvailable(Date.now())) {
    for (const opponentUnitId of opponentUnitIds) {
      const targetUnit = opponentGameData.getUnit(opponentUnitId);

      if (!validateTarget(attackUnit, targetUnit)) continue;

      const resultHp = targetUnit.applyDamage(attackUnit.getAttackPower());

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
