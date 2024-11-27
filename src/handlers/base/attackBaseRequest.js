import { PACKET_TYPE } from '../../constants/header.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import CustomErr from './../../utils/error/customErr.js';
import { handleErr } from './../../utils/error/handlerErr.js';

const attackBaseRequest = (socket, payload) => {
  const { unitId } = payload;

  try {
    const { userGameData, opponentGameData, gameSession } = checkSessionInfo(socket);

    if (!userGameData || !opponentGameData) {
      throw new CustomErr(ERR_CODES.USER_NOT_FOUND, '유닛 정보를 불러오는데 실패하였습니다.');
    }

    const damage = userGameData.getUnit(unitId).getAttackPower();
    if (!damage) throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, '유닛 정보를 찾을 수 없습니다.');

    // 미점령 상태 성채 공격은 가능할 수 없음.
    const checkPointManager = gameSession.getCheckPointManager();
    if (!checkPointManager.getCheckPointState(unitId))
      throw new CustomErr(
        ERR_CODES.UNOCCUPIED_STATE_CHECKPOINT,
        '체크포인트가 점령되지 않은 상태에서는 공격할 수 없습니다.',
      );

    const newBaseHp = opponentGameData.attackBase(damage);

    if (newBaseHp <= 0) {
      // 게임 종료 메서드 호출
      gameSession.endGame();
    } else {
      [
        { socket: userGameData.getSocket(), type: PACKET_TYPE.ATTACK_BASE_RESPONSE },
        { socket: opponentGameData.getSocket(), type: PACKET_TYPE.BASE_ATTACKED_NOTIFICATION },
      ].forEach(({ socket, type }) => sendPacket(socket, type, { baseHp: newBaseHp }));
    }
  } catch (err) {
    handleErr(socket, err);
  }
};

export default attackBaseRequest;
