import { UNIT_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

const buffUnitRequest = (socket, payload) => {
  try {
    const {
      unitId,
      timestamp,
      targetIds,
      buffAmount: initialBuffAmount,
      buffDuration: initialBuffDuration,
    } = payload;

    let buffAmount = initialBuffAmount;
    let buffDuration = initialBuffDuration;

    // 세션 정보 검증 및 유저 데이터 가져오기
    const { userGameData, opponentSocket } = checkSessionInfo(socket);

    // 요청 유닛(버프 유닛)과 대상 유닛 가져오기
    const bufferUnit = userGameData.getUnit(unitId);
    if (!bufferUnit) {
      throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, 'Unit not found');
    }

    // 버프 유닛이 올바른 유닛 타입인지 검증
    if (bufferUnit.getType() !== UNIT_TYPE.BUFFER) {
      throw new Error('Unit Type Error');
    }

    // 스킬 쿨타임 검증
    if (!bufferUnit.isSkillAvailable(timestamp)) {
      buffAmount = 0;
      buffDuration = 0;
    }

    // 결과 저장용 배열
    const affectedUnits = [];

    // 각 대상 유닛에 버프 적용
    for (const targetId of targetIds) {
      const targetUnit = userGameData.getUnit(targetId);
      if (!targetUnit) {
        logger.info(`Target unit with ID ${targetId} not found`);
        continue;
      }

      // 너무 먼 사거리 공격 방지용
      if (bufferUnit.isTargetOutOfRange(targetUnit)) {
        continue;
      }

      // 같은 라인이여야 버프 가능
      if (targetUnit.direction !== bufferUnit.direction) {
        logger.info(`Target ${targetUnit} is not your line`);
        continue;
      }

      targetUnit.applyBuff(buffAmount, buffDuration);
      bufferUnit.resetLastSkillTime(timestamp);

      affectedUnits.push(targetId);
    }

    // 리스폰스 전송
    sendPacket(socket, PACKET_TYPE.BUFF_UNIT_RESPONSE, {
      unitId,
      targetIds: affectedUnits,
      buffAmount,
      buffDuration,
    });

    // 상대방 노티피케이션
    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_BUFF_UNIT_NOTIFICATION, {
      unitId,
      targetIds: affectedUnits,
      buffAmount,
      buffDuration,
    });
  } catch (err) {
    handleErr(socket, err);
  }
};

export default buffUnitRequest;
