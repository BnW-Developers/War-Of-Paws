import { MAX_PLAYERS } from '../../constants/game.constants.js';
class LocationSyncManager {
  constructor() {
    // 동기화에 사용될 위치값 초기화
    this.positionsToSync = new Map();
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

    // 검증: 최대 플레이어 수를 초과하는가?
    if (this.positionsToSync.size === MAX_PLAYERS) {
      throw new Error(`플레이어 정원을 초과하였습니다.`);
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
  createLocationSyncPacket(gameId, userId, opponentId) {
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

    return { userPacketData, opponentPacketData };
  }

  /**
   * 위치 동기화 완료 후 서버에 저장한 동기화 위치값을 리셋
   */
  resetSyncPositions() {
    this.positionsToSync = new Map();
  }
}

export default LocationSyncManager;
