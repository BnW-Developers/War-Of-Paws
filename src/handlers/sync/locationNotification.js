import { handleErr } from '../../utils/error/handlerErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import CustomErr from '../../utils/error/customErr.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import { PACKET_TYPE } from '../../constants/header.js';
import adjustPos from '../../utils/location/adjustPos.js';
import isValidPos from '../../utils/location/isValidPos.js';
import formatCoords from '../../utils/formatter/formatCoords.js';
import logger from '../../utils/log/logger.js';
import {
  LOG_ENABLED_ADJUST_POS,
  LOG_ENABLED_LOCATION_SYNC_PAYLOAD,
} from '../../utils/log/logSwitch.js';

/**
 * 위치 동기화 핸들러
 * @param {net.Socket} socket
 * @param {{unitPositions: {unitId: int32, position: {x: float, z: float}, rotation: {y: float}}[], timestamp: int64}} payload
 */
const locationNotification = (socket, payload) => {
  try {
    // 세션 정보 검증
    const { userGameData, opponentSocket } = checkSessionInfo(socket);

    // 해당 클라이언트가 보유한 유닛들의 위치 + 동기화 시점
    const { unitPositions } = payload;
    const timestamp = Date.now();

    if (LOG_ENABLED_LOCATION_SYNC_PAYLOAD)
      console.log(
        `위치 동기화 payload:\n` +
          `    unitPositions: ${JSON.stringify(unitPositions, null, 4)}` +
          `    timestamp: ${JSON.stringify(timestamp)}`,
      );

    // 전송할 패킷 데이터 초기화
    const userPacketData = { unitPositions: [] };
    const opponentPacketData = { unitPositions: [] };

    // 각 유닛의 동기화 위치값을 계산
    for (const unitPosition of unitPositions) {
      // 클라이언트에서 보낸 유닛의 위치
      const { unitId, position, rotation } = unitPosition;

      // 검증: 해당 플레이어가 보유한 (소환한) 유닛인가?
      const unit = userGameData.getUnit(unitId);
      if (!unit) {
        throw new CustomErr(ERR_CODES.UNOWNED_UNIT, '유저가 보유한 유닛이 아닙니다.');
      }

      // 유닛의 위치가 비정상적이라면 보정
      let adjustedPos = position;
      let modified = false;
      if (!isValidPos(unit, position, timestamp)) {
        adjustedPos = adjustPos(unit, timestamp);
        modified = true;

        if (LOG_ENABLED_ADJUST_POS)
          logger.info(
            `유닛 ${unitId} 위치 보정: ${formatCoords(position, 2)}->${formatCoords(adjustedPos, 2)}`,
          );
      }

      // 서버 내 유닛 인스턴스를 새로운 위치로 업데이트
      unit.move(position, rotation, timestamp);

      // 최종 위치를 패킷 데이터에 추가
      // 1. User 패킷: 위치가 보정된 유닛만 추가
      if (modified) {
        userPacketData.unitPositions.push({ unitId, position, rotation });
      }
      // 2. Opponent 패킷: 모든 유닛 추가
      opponentPacketData.unitPositions.push({ unitId, position, rotation });
    }

    // 패킷 전송
    if (userPacketData.unitPositions.length > 0) {
      sendPacket(socket, PACKET_TYPE.LOCATION_SYNC_NOTIFICATION, userPacketData);
    }
    if (opponentPacketData.unitPositions.length > 0) {
      sendPacket(opponentSocket, PACKET_TYPE.LOCATION_SYNC_NOTIFICATION, opponentPacketData);
    }
  } catch (err) {
    handleErr(socket, err);
  }
};

export default locationNotification;
