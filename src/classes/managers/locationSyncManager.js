import { MAX_PLAYERS } from '../../constants/game.constants.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

class LocationSyncManager {
  constructor() {
    // 동기화에 사용될 위치값 초기화
    this.positionsToSync = new Map();
  }

  /**
   * 두 좌표 사이의 직선거리를 스칼라값으로 반환
   * @param {{x: float, y: float, z: float}} pos1
   * @param {{x: float, y: float, z: float}} pos2
   * @returns {float}
   */
  calculateDistance(pos1, pos2) {
    // 검증: 좌표의 형식이 올바른가?
    if (!pos1 || !pos1.x || !pos1.y || !pos1.z) {
      throw new Error('잘못된 좌표입니다: pos1', pos1);
    }

    if (!pos2 || !pos2.x || !pos2.y || !pos2.z) {
      throw new Error('잘못된 좌표입니다: pos1', pos2);
    }

    // √((x1-x2)^2 + (y1-y2)^2 + (z1-z2)^2)
    return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2 + (pos1.z - pos2.z) ** 2);
  }

  /**
   * 클라이언트가 보낸 유닛의 위치값을 보정하여 보정된 위치값을 반환
   * @param {[x: float, y: float, z: float]} actualPos
   * @param {[x: float, y: float, z: float]} expectedPos
   * @param {[x: float, y: float, z: float]} marginOfErr
   * @return {{adjustedPosition: {x: float, y: float, z: float}, modified: boolean}}
   */
  adjustPosition(actualPos, expectedPos, marginOfErr) {
    // 검증: 좌표의 형식이 올바른가?
    if (!actualPos || actualPos.length != 3) {
      throw new Error('잘못된 좌표입니다: actualPos', actualPos);
    }
    if (!expectedPos || expectedPos.length != 3) {
      throw new Error('잘못된 좌표입니다: expectedPos', expectedPos);
    }
    if (!marginOfErr || marginOfErr.length != 3) {
      throw new Error('잘못된 좌표입니다: marginOfErr', marginOfErr);
    }

    const adjustedPos = [];
    let modified = false;

    for (let dir = 0; dir < 3; dir++) {
      const withinLowerBound = expectedPos[dir] - marginOfErr[dir] <= actualPos[dir];
      const withinUpperBound = actualPos[dir] <= expectedPos[dir] + marginOfErr[dir];
      const validPosition = withinLowerBound && withinUpperBound;

      // 오차범위 내일 경우 클라이언트가 보낸 위치값을 실값으로 인정
      if (validPosition) {
        adjustedPos[dir] = actualPos[dir];
        // 오차범위 밖일 경우 서버의 계산값을 실값으로 처리
      } else {
        adjustedPos[dir] = expectedPos[dir];
        modified = true; // 해당 좌표가 보정되었는지 여부
      }
    }

    // 배열 -> 객체로 형식을 변경한 뒤 반환
    return {
      adjustedPosition: { x: adjustedPos[0], y: adjustedPos[1], z: adjustedPos[2] },
      modified,
    };
  }

  /**
   * 동기화에 사용될 위치값 업데이트
   * @param {string} userId
   * @param {{unitId: int32, position: {x: float, y: float, z: float}, modified: boolean}[]} unitPositions
   */
  addSyncPositions(userId, unitPositions) {
    // 검증: 이미 기록한 위치값인가?
    if (this.positionsToSync.has(userId)) {
      throw new Error('이미 해당 클라이언트의 위치값을 기록했습니다: userid', userId);
    }

    // 해당 유저의 동기화 위치값 저장
    this.positionsToSync.set(userId, unitPositions);
  }

  /**
   * 해당 게임세션의 위치동기화 실행 준비여부를 반환
   *
   * 위치 동기화 실행 준비조건: 모든 유닛의 동기화 위치값 산출 완료
   * @returns {boolean}
   */
  isSyncReady() {
    return this.positionsToSync.size === MAX_PLAYERS;
  }

  /**
   * 각 클라이언트로 전송할 위치 동기화 패킷을 작성
   * @param {string} userId
   * @param {string} opponentId
   * @param {net.Socket} socket
   * @param {net.Socket} opponentSocket
   * @return {{userPacket: Buffer, opponentPacket: Buffer}}
   */
  createLocationSyncPacket(userId, opponentId, socket, opponentSocket) {
    // 해당 게임의 모든 동기화 위치값
    const userSyncPositions = this.positionsToSync.get(userId);
    const opponentSyncPositions = this.positionsToSync.get(opponentId);

    // 1. User 패킷 작성
    const userPacketData = { unitPositions: [] };

    // 본인 (User) 소유의 유닛은 위치가 보정된 경우에만 전송
    for (const userSyncPosition of userSyncPositions) {
      if (!userSyncPosition.modified) {
        continue;
      }

      const { unitId, position } = userSyncPosition;
      userPacketData.unitPositions.push({ unitId, position });
    }

    // 상대방 (Opponent) 소유의 유닛은 전부 전송
    for (const opponentSyncPosition of opponentSyncPositions) {
      const { unitId, position } = opponentSyncPosition;
      userPacketData.unitPositions.push({ unitId, position });
    }

    // 2. Opponent 패킷 작성
    const opponentPacketData = { unitPositions: [] };

    // 본인 (Opponent) 소유의 유닛은 위치가 보정된 경우에만 전송
    for (const opponentSyncPosition of opponentSyncPositions) {
      if (!opponentSyncPosition.modified) {
        continue;
      }

      const { unitId, position } = opponentSyncPosition;
      opponentPacketData.unitPositions.push({ unitId, position });
    }

    // 상대방 (User) 소유의 유닛은 전부 전송
    for (const userSyncPosition of userSyncPositions) {
      const { unitId, position } = userSyncPosition;
      opponentPacketData.unitPositions.push({ unitId, position });
    }

    // 3. 패킷 작성 및 반환
    const userPacket = createResponse(
      PACKET_TYPE.LOCATION_SYNC_NOTIFICATION,
      socket.sequence++,
      userPacketData,
    );

    const opponentPacket = createResponse(
      PACKET_TYPE.LOCATION_SYNC_NOTIFICATION,
      opponentSocket.sequence++,
      opponentPacketData,
    );

    return { userPacket, opponentPacket };
  }

  /**
   * 위치 동기화 완료 후 서버에 저장한 동기화 위치값을 리셋
   */
  resetSyncPositions() {
    this.positionsToSync = new Map();
  }
}

export default LocationSyncManager;
