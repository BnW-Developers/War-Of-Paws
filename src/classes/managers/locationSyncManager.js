class LocationSyncManager {
  constructor(userId, opponentId) {
    // 동기화에 사용될 위치값 초기화
    this.positionsToSync = new Map([
      [userId, []],
      [opponentId, []],
    ]);
  }

  /**
   * 각 클라이언트로 전송할 위치 동기화 패킷을 작성
   * @param {{unitId: int32, position: {x: float, z: float}, rotation: {y: float}, modified: boolean}[]} unitPositions
   * @return {{userPacket: Buffer, opponentPacket: Buffer}}
   */
  createLocationSyncPacket(unitPositions) {
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
   * @param {PlayerGameData} userGameData
   * @param {int64} timestamp
   * @param {{unitId: int32, position: {x: float, z: float}, rotation: {y: float}, modified: boolean}[]} unitPositions
   */
  moveUnits(userGameData, timestamp, unitPositions) {
    for (const unitPosition of unitPositions) {
      const { unitId, position, rotation } = unitPosition;
      const unit = userGameData.getUnit(unitId);
      unit.move(position, rotation, timestamp);
    }
  }
}

export default LocationSyncManager;
