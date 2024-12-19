import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

/**
 * 성채 데미지 처리
 * @param {net.Socket} socket
 * @param {{ unitId: int32}} payload
 */
const damageBaseRequest = (socket, payload) => {
  try {
    const { unitId } = payload;

    const { userGameData, opponentGameData, opponentSocket, gameSession } =
      checkSessionInfo(socket);

    const unit = userGameData.getUnit(unitId);
    if (!unit) throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, '유닛 정보를 찾을 수 없습니다.');

    if (!unit.hasRemainingProjectile()) {
      throw new CustomErr(
        ERR_CODES.ATTACK_VALIDATION_FAILED,
        '공격 검증에 통과하지 못한 요청입니다.',
      );
    }

    const damage = unit.getAttackPower();
    const newBaseHp = opponentGameData.attackBase(damage);

    unit.removeProjectile();

    sendPacket(socket, PACKET_TYPE.DAMAGE_BASE_RESPONSE, { baseHp: newBaseHp });
    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_DAMAGE_BASE_NOTIFICATION, { baseHp: newBaseHp });

    if (newBaseHp <= 0) {
      gameSession.endGame();
    }
  } catch (err) {
    handleErr(socket, err);
  }
};

export default damageBaseRequest;
