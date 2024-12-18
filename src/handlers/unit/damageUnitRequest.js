import { PACKET_TYPE } from '../../constants/header.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

/**
 * 클라이언트로부터 데미지 요청을 수행하고 결과를 응답으로 전송
 * @param {net.socket} socket
 * @param {{ attackingUnitId: int32, targetUnitId: int32 }} payload
 */
const damageUnitRequest = (socket, payload) => {
  try {
    const { attackingUnitId, targetUnitId } = payload;
    const deathUnits = [];

    const { userGameData, opponentGameData, opponentSocket, gameSession } =
      checkSessionInfo(socket);

    // unitId가 피공격자, opponent가 공격자
    const targetUnit = opponentGameData.getUnit(targetUnitId);
    const attackingUnit = userGameData.getUnit(attackingUnitId);

    const resultHp = targetUnit.applyDamage(attackingUnit.getAttackPower());

    // 사망 체크
    if (targetUnit.getHp() <= 0) {
      if (targetUnit.isDead()) {
        targetUnit.markAsDead();
        const checkPointManager = gameSession.getCheckPointManager();
        if (checkPointManager.isExistUnit(targetUnit)) {
          checkPointManager.removeUnit(targetUnit);
        }

        opponentGameData.removeUnit(targetUnitId);
        deathUnits.push(targetUnitId);
        sendPacket(opponentSocket, PACKET_TYPE.UNIT_DEATH_NOTIFICATION, {
          unitIds: deathUnits,
        });

        sendPacket(socket, PACKET_TYPE.UNIT_DEATH_NOTIFICATION, {
          unitIds: deathUnits,
        });
      }
    }

    const unitInfo = {
      unitId: targetUnitId,
      unitHp: resultHp,
    };

    sendPacket(opponentSocket, PACKET_TYPE.DAMAGE_UNIT_NOTIFICATION, {
      unitInfo,
    });

    sendPacket(socket, PACKET_TYPE.DAMAGE_UNIT_NOTIFICATION, {
      unitInfo,
    });
  } catch (error) {
    handleErr(socket, error);
  }
};

export default damageUnitRequest;
