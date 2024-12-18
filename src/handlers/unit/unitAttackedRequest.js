import { PACKET_TYPE } from '../../constants/header.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

/**
 * 클라이언트로부터 데미지 요청을 수행하고 결과를 응답으로 전송
 * @param {net.socket} socket
 * @param {{ attackingUnitId: int32, attackedUnitId: int32 }} payload
 */
const unitAttackedRequest = (socket, payload) => {
  try {
    const { attackingUnitId, attackedUnitId } = payload;
    const deathUnits = [];

    const { userGameData, opponentGameData, opponentSocket, gameSession } =
      checkSessionInfo(socket);

    // unitId가 피공격자, opponent가 공격자
    const attackedUnit = opponentGameData.getUnit(attackedUnitId);
    const attackingUnit = userGameData.getUnit(attackingUnitId);

    const resultHp = attackedUnit.applyDamage(attackingUnit.getAttackPower());

    // 사망 체크
    if (attackedUnit.getHp() <= 0) {
      if (attackedUnit.isDead()) {
        attackedUnit.markAsDead();
        const checkPointManager = gameSession.getCheckPointManager();
        if (checkPointManager.isExistUnit(attackedUnit)) {
          checkPointManager.removeUnit(attackedUnit);
        }

        opponentGameData.removeUnit(attackedUnitId);
        deathUnits.push(attackedUnitId);
        sendPacket(opponentSocket, PACKET_TYPE.UNIT_DEATH_NOTIFICATION, {
          unitIds: deathUnits,
        });

        sendPacket(socket, PACKET_TYPE.ENEMY_UNIT_DEATH_NOTIFICATION, {
          unitIds: deathUnits,
        });
      }
    }

    const unitInfo = {
      unitId: attackedUnitId,
      unitHp: resultHp,
    };

    sendPacket(opponentSocket, PACKET_TYPE.UNIT_ATTACKED_RESPONSE, {
      unitInfo: unitInfo,
    });

    sendPacket(socket, PACKET_TYPE.ENEMY_UNIT_ATTACKED_NOTIFICATION, {
      unitInfo: unitInfo,
    });
  } catch (error) {
    handleErr(socket, error);
  }
};

export default unitAttackedRequest;
