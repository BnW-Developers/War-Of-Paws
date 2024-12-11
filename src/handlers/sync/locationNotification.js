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
 * **위치 동기화 핸들러**
 * 
 * <위치 동기화 과정>
     1. 모든 유닛의 동기화 위치값 산출
        - 각 클라이언트가 보유한 유닛들의 동기화 위치값 산출
          - `locationNotification()`: 해당 클라이언트가 보유한 유닛들의 현재 위치값을 수신 
          - for (unit of units)
            - `isValidPos()`: 해당 유닛의 좌표가 정상적인지 검증
            - `adjustPosition()`: 유닛의 좌표가 정상이 아닌 경우 위치값을 보정
          - `addSyncPositions()`: 보정한 위치값, 보정 여부, 패킷의 타임스탬프를를 서버에 저장
        - 위 과정을 두 클라이언트가 모두 완료
     2. `isSyncReady()`: 위 과정을 완료했는지 확인
     3. `syncPositions()`: 위치 동기화 실행
        - 각 클라이언트에게 새로운 위치값을 전송
          - 보유한 (직접 소환한) 유닛의 경우 위치가 보정된 위치값만 전송
          - 보유하지 않은 (상대방 진영의) 유닛의 경우 모든 위치값을 전송
     4. `moveUnits()`: 서버 내 유닛 객체들의 위치 및 목적지를 업데이트
     5. `deleteSyncPositions()`: 서버에 저장한 동기화 위치값을 삭제
     6. 각 클라이언트는 수신한 위치값으로 해당 유닛들의 위치를 수정 (보간 적용)
 * @param {net.Socket} socket
 * @param {{unitPositions: {unitId: int32, position: {x: float, z: float}, rotation: {y: float}}[], timestamp: int64}} payload
 */
const locationNotification = async (socket, payload) => {
  try {
    const { gameSession, userGameData, opponentSocket } = checkSessionInfo(socket);

    const locationSyncManager = gameSession.getLocationSyncManager();

    // 해당 클라이언트가 보유한 유닛들의 위치 + 동기화 시점
    const { unitPositions, timestamp } = payload;

    if (LOG_ENABLED_LOCATION_SYNC_PAYLOAD)
      console.log(
        `위치 동기화 payload:\n` +
          `    unitPositions: ${JSON.stringify(unitPositions, null, 4)}` +
          `    timestamp: ${JSON.stringify(timestamp)}`,
      );

    // 동기화할 위치값
    const syncPositions = [];

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

      // 보정한 위치를 동기화 위치 배열에 추가
      const syncPosition = { unitId, position: adjustedPos, rotation, modified };
      syncPositions.push(syncPosition);
    }

    // 패킷 작성 및 전송
    const { userPacketData, opponentPacketData } =
      locationSyncManager.createLocationSyncPacket(syncPositions);

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
