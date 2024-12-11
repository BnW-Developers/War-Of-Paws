class LocationSyncManager {
  constructor(userId, opponentId) {
    // 동기화에 사용될 위치값 초기화
    this.positionsToSync = new Map([
      [userId, []],
      [opponentId, []],
    ]);
  }
}

export default LocationSyncManager;
