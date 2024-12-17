import { PACKET_TYPE } from '../../constants/header.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import CustomErr from './../../utils/error/customErr.js';
import { handleErr } from './../../utils/error/handlerErr.js';

const baseAttackedRequest = (socket, payload) => {
  try {
    const { unitId } = payload;

    const { userGameData, opponentGameData, opponentSocket, gameSession } =
      checkSessionInfo(socket);

    const unit = userGameData.getUnit(unitId);
    if (!unit) throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, '유닛 정보를 찾을 수 없습니다.');

    const damage = unit.getAttackPower();
    const newBaseHp = opponentGameData.attackBase(damage);

    sendPacket(socket, PACKET_TYPE.BASE_ATTACKED_RESPONSE, { baseHp: newBaseHp });
    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_BASE_ATTACKED_NOTIFICATION, { baseHp: newBaseHp });

    if (newBaseHp <= 0) {
      gameSession.endGame();
    }
  } catch (err) {
    handleErr(socket, err);
  }
};

export default baseAttackedRequest;
