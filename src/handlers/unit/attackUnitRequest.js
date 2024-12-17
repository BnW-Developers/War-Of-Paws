import Game from '../../classes/models/game.class.js'; // eslint-disable-line
import PlayerGameData from '../../classes/models/playerGameData.class.js'; // eslint-disable-line
import Unit from '../../classes/models/unit.class.js'; // eslint-disable-line
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import validateTarget from '../../utils/unit/validationTarget.js';

/**
 * 클라이언트로부터 공격 요청을 처리하고, 공격 로직을 수행한 뒤 결과를 응답으로 전송
 * @param {net.Socket} socket
 * @param {{ unitId: int32, opponentUnitIds: Array<int32> }} payload
 */
const attackUnitRequest = (socket, payload) => {
  try {
    const { attackingUnitId, attackedUnitIds } = payload;
    const timestamp = Date.now();
    const validatedAttackedUnits = [];

    const { userGameData, opponentGameData, opponentSocket } = checkSessionInfo(socket);

    const attackingUnit = validateAttackUnit(userGameData, attackingUnitId);

    attackingUnit.checkAttackCooldown(timestamp);

    attackingUnit.resetLastAttackTime(timestamp);

    for (const attackedUnitId of attackedUnitIds) {
      const attackedUnit = opponentGameData.getUnit(attackedUnitId);

      if (!validateTarget(attackingUnit, attackedUnit, 'attack')) {
        continue;
      }

      validatedAttackedUnits.push({
        attackedUnitIds,
      });
    }

    sendPacket(socket, PACKET_TYPE.ATTACK_UNIT_RESPONSE, {
      attackingUnitId,
      attackedUnitIds: validatedAttackedUnits,
    });

    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_UNIT_ATTACK_NOTIFICATION, {
      attackingUnitId,
      attackedUnitIds: validatedAttackedUnits,
    });
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

export default attackUnitRequest;
