import sendPacket from '../../classes/models/sendPacket.class.js';
import { UNIT_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { createResponse } from '../../utils/response/createResponse.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

const buffUnitRequest = (socket, payload) => {
  try {
    const { unitId, targetIds, buffAmount, buffDuration } = payload;

    // 세션 정보 검증 및 유저 데이터 가져오기
    const { userGameData, opponentSocket } = checkSessionInfo(socket);
    if (!userGameData) {
      throw new CustomErr(ERR_CODES.PLAYER_GAME_DATA_NOT_FOUND, 'Player game data not found');
    }

    // 요청 유닛(버프 유닛)과 대상 유닛 가져오기
    const buffUnit = userGameData.getUnit(unitId);

    if (!buffUnit) {
      throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, 'Buffing or Target Unit not found');
    }

    // 버프 유닛이 올바른 유닛 타입인지 검증
    if (buffUnit.getAssetId() !== UNIT_TYPE.BUFFER) {
      throw new CustomErr(ERR_CODES.INVALID_UNIT_TYPE, 'Unit cannot apply buffs');
    }

    // 스킬 쿨타임 검증
    if (!buffUnit.isSkillAvailable()) {
      // 얘도 쿨타임이면 어떻게 처리하지?
      // 1. 리스폰스에 버프양을 0 지속시간을 0으로 해 무효화 시키는 방법
      // 2. 오류 패킷 혹은 거절 패킷을 보내 유닛의 행동을 취소 시킨다
      // 3. 에러패킷을 보내 게임을 정지시킨다.
    }

    // 결과 저장용 배열
    const affectedUnits = [];
    // 각 대상 유닛에 버프 적용
    for (const targetId of targetIds) {
      const targetUnit = userGameData.getUnit(targetId);
      if (!targetUnit) {
        // 경고인 이유: 버프 리스폰스를 받기 전에 사망할 수 있는 가능성 있음
        console.warn(`Target unit with ID ${targetId} not found`);
        continue;
      }

      targetUnit.applyBuff(buffAmount, buffDuration);

      affectedUnits.push(targetId);
    }

    // 응답 패킷
    const buffUnitResponsePacket = createResponse(
      PACKET_TYPE.BUFF_UNIT_RESPONSE,
      socket.sequence++,
      {
        unitId,
        targetIds: affectedUnits,
        buffAmount,
        buffDuration,
      },
    );

    // 응답
    sendPacket.enQueue(socket, buffUnitResponsePacket);

    // 상대방 노티피케이션
    const enemyBuffUnitNotification = createResponse(
      PACKET_TYPE.ENEMY_BUFF_UNIT_NOTIFICATION,
      socket.sequence++,
      {
        unitId,
        targetIds: affectedUnits,
        buffAmount,
        buffDuration,
      },
    );

    sendPacket.enQueue(opponentSocket, enemyBuffUnitNotification);
  } catch (err) {
    handleErr(socket, err);
  }
};

export default buffUnitRequest;
