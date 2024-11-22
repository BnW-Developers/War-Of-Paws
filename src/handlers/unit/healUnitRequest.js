import sendPacket from '../../classes/models/sendPacket.class.js';
import { UNIT_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { createResponse } from '../../utils/response/createResponse.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

const healUnitRequest = (socket, payload) => {
  try {
    const { unitId, targetUnitId, healAmount } = payload;

    const { userGameData, opponentSocket } = checkSessionInfo(socket);
    if (!userGameData) {
      throw new CustomErr(ERR_CODES.PLAYER_GAME_DATA_NOT_FOUND, 'Player game data not found');
    }

    // 힐러 유닛과 대상 유닛 가져오기
    const healerUnit = userGameData.getUnit(unitId);
    const targetUnit = userGameData.getUnit(targetUnitId);

    if (!healerUnit || !targetUnit) {
      throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, 'Unit not found');
    }

    // 힐러 유닛이 힐 스킬을 가지고 있는지 검증
    // HEAL_UNIT_CODE
    if (healerUnit.getAssetId() !== UNIT_TYPE.HEALER) {
      throw new Error('Unit does not have a heal skill');
    }

    // 스킬 쿨타임 검증
    if (!healerUnit.isSkillAvailable()) {
      // 만약 요청이 왔는데 쿨타임일 땐 어떻게 해야하지..?
    }

    // 힐 로직
    const afterHealHp = targetUnit.applyHeal(healAmount);

    // 마지막 스킬 사용시간 초기화
    healerUnit.resetLastSkillUsedTime();

    // 응답 패킷 작성
    const healUnitResponsePacket = createResponse(
      PACKET_TYPE.HEAL_UNIT_RESPONSE,
      socket.sequence++,
      {
        unitId,
        targetUnitId,
        unitHp: afterHealHp,
      },
    );

    // 응답 전송
    sendPacket.enQueue(socket, healUnitResponsePacket);

    // 노티피케이션 전송

    const enemyHealUnitNotification = createResponse(
      PACKET_TYPE.ENEMY_HEAL_UNIT_NOTIFICATION,
      socket.sequence++,
      {
        unitId,
        targetUnitId,
        unitHp: afterHealHp,
      },
    );

    // 노티피케이션 전송
    sendPacket.enQueue(opponentSocket, enemyHealUnitNotification);
  } catch (err) {
    handleErr(socket, err);
  }
};

export default healUnitRequest;
