import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
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

    const targetUnit = opponentGameData.getUnit(targetUnitId);
    const attackingUnit = userGameData.getUnit(attackingUnitId);

    if (!attackingUnit.hasRemainingProjectile()) {
      throw new CustomErr(
        ERR_CODES.ATTACK_VALIDATION_FAILED,
        '공격 검증에 통과하지 못한 요청입니다.',
      );
    }

    const resultHp = targetUnit.applyDamage(attackingUnit.getAttackPower());

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

    // 사망 체크
    if (targetUnit.getHp() <= 0) {
      if (!targetUnit.isDead()) {
        targetUnit.markAsDead();
        const checkPointManager = gameSession.getCheckPointManager();
        if (checkPointManager.isExistUnit(targetUnitId)) {
          checkPointManager.removeUnit(targetUnitId);
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

    attackingUnit.removeProjectile();
  } catch (error) {
    handleErr(socket, error);
  }
};

export default damageUnitRequest;
