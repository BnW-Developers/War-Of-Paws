import { PACKET_TYPE } from '../../constants/header.js';
import { baseLocation } from '../../utils/assets/getAssets.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import CustomErr from './../../utils/error/customErr.js';
import { handleErr } from './../../utils/error/handlerErr.js';

const attackBaseRequest = (socket, payload) => {
  try {
    const { unitId } = payload;
    const timestamp = Date.now();

    const { userGameData, opponent, opponentSocket, gameSession } = checkSessionInfo(socket);

    const unit = userGameData.getUnit(unitId);
    if (!unit) throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, '유닛 정보를 찾을 수 없습니다.');

    // 쿨타임 검증
    unit.checkAttackCooldown(timestamp);

    unit.resetLastAttackTime(timestamp);

    const species = opponent.getCurrentSpecies();
    if (unit.isTargetOutOfRange(baseLocation[species])) {
      throw new CustomErr(ERR_CODES.OUT_OF_RANGE, '대상 (성채)가 사거리 밖에 있습니다.');
    }

    // 미점령 상태 성채 공격은 가능할 수 없음.
    const checkPointManager = gameSession.getCheckPointManager();
    if (!checkPointManager.getCheckPointState(unitId)) {
      throw new CustomErr(
        ERR_CODES.UNOCCUPIED_STATE_CHECKPOINT,
        '체크포인트가 점령되지 않은 상태에서는 공격할 수 없습니다.',
      );
    }

    sendPacket(socket, PACKET_TYPE.ATTACK_BASE_RESPONSE, { unitId });
    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_ATTACK_BASE_NOTIFICATION, { unitId });
  } catch (err) {
    handleErr(socket, err);
  }
};

export default attackBaseRequest;
