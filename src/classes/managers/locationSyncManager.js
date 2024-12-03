import { Mutex } from 'async-mutex';

class LocationSyncManager {
  constructor(userId, opponentId) {
    // 동기화에 사용될 위치값 초기화
    this.positionsToSync = new Map([
      [userId, []],
      [opponentId, []],
    ]);

    this.lock = new Mutex();
  }

  /**
   * 동기화에 사용될 위치값 업데이트
   * @param {string} userId
   * @param {int64} timestamp
   * @param {{unitId: int32, position: {x: float, z: float}, rotation: {y: float}, modified: boolean}[]} unitPositions
   */
  addSyncPositions(userId, timestamp, unitPositions) {
    const positionToSync = { timestamp, unitPositions };
    this.positionsToSync.get(userId).push(positionToSync); // Queue에 추가
  }

  /**
   * 각 클라이언트로 전송할 위치 동기화 패킷을 작성
   * @param {string} userId
   * @return {{userPacket: Buffer, opponentPacket: Buffer}}
   */
  createLocationSyncPacket(userId) {
    // 해당 게임의 모든 동기화 위치값 (Queue의 첫 번째 항목)
    const { unitPositions } = this.positionsToSync.get(userId)[0];

    // 1. User 패킷 작성: 위치가 보정된 경우에만 전송
    const userPacketData = { unitPositions: [] };

    for (const unitPosition of unitPositions) {
      if (unitPosition.modified) {
        const { unitId, position, rotation } = unitPosition;
        userPacketData.unitPositions.push({ unitId, position, rotation });
      }
    }

    // 2. Opponent 패킷 작성: 전부 전송
    const opponentPacketData = { unitPositions: [] };

    for (const unitPosition of unitPositions) {
      const { unitId, position, rotation } = unitPosition;
      opponentPacketData.unitPositions.push({ unitId, position, rotation });
    }

    return { userPacketData, opponentPacketData };
  }

  /**
   * 서버 내 유닛 객체들의 위치값 및 목적지 업데이트
   * @param {string} userId
   * @param {PlayerGameData} userGameData
   */
  moveUnits(userId, userGameData) {
    // 동기화 후 유닛들의 새로운 위치값 (Queue의 첫 번째 항목)
    const { unitPositions, timestamp } = this.positionsToSync.get(userId)[0];

    // 유닛 위치 및 목적지 업데이트
    for (const unitPosition of unitPositions) {
      const { unitId, position, rotation } = unitPosition;
      const unit = userGameData.getUnit(unitId);
      unit.move(position, rotation, timestamp);
    }
  }

  /**
   * 위치 동기화 완료 후 서버에 저장한 동기화 위치값을 삭제
   */
  deleteSyncPositions(userId) {
    this.positionsToSync.get(userId).shift();
  }
}

export default LocationSyncManager;
