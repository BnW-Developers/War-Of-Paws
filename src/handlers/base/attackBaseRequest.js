import gameSessionManager from '../../classes/managers/gameSessionManager.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import CustomErr from './../../utils/error/customErr.js';
import { handleErr } from './../../utils/error/handlerErr.js';

const attackBaseRequest = (socket, payload) => {
  const { unitId } = payload;

  try {
    const { player, opponent } = gameSessionManager.getAllPlayerGameDataBySocket(socket);
    if (!player || !opponent) {
      throw new CustomErr(ERR_CODES.USER_NOT_FOUND, '유닛 정보를 불러오는데 실패하였습니다.');
    }

    const damage = player.getUnitById(unitId).getAttackPower();
    if (!damage) throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, '유닛 정보를 찾을 수 없습니다.');

    const newBaseHp = opponent.attackBase(damage);

    if (newBaseHp <= 0) {
      // 게임 종료 메서드 호출
      // gameSession.endGame(player);
    } else {
      [
        { socket: player.getSocket(), type: PACKET_TYPE.ATTACK_BASE_RESPONSE },
        { socket: opponent.getSocket(), type: PACKET_TYPE.BASE_ATTACKED_NOTIFICATION },
      ].forEach(({ socket, type }) => sendPacket(socket, type, { baseHp: newBaseHp }));
    }
  } catch (err) {
    handleErr(socket, err);
  }
};

export default attackBaseRequest;
