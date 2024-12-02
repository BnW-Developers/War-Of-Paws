import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import { Mutex } from 'async-mutex';

class LocationSyncManager {
  constructor(userId, opponentId) {
    this.playerIds = [userId, opponentId];

    // 동기화에 사용될 위치값 초기화
    this.positionsToSync = new Map();
    this.positionsToSync.set(userId, []);
    this.positionsToSync.set(opponentId, []);

    this.lock = new Mutex();
  }

  /**
   * 동기화에 사용될 위치값 업데이트
   * @param {string} userId
   * @param {int32} timestamp
   * @param {{unitId: int32, position: {x: float, z: float}, modified: boolean}[]} unitPositions
   */
  addSyncPositions(userId, timestamp, unitPositions) {
    const positionToSync = { timestamp, unitPositions };
    this.positionsToSync.get(userId).push(positionToSync); // Queue에 추가
  }

  /**
   * 해당 게임세션의 위치동기화 실행 준비여부를 반환
   *
   * 위치 동기화 실행 준비조건: 모든 유닛의 동기화 위치값 산출 완료
   * @returns {boolean}
   */
  isSyncReady() {
    const player1Ready = this.positionsToSync.get(this.playerIds[0]).length > 0;
    const player2Ready = this.positionsToSync.get(this.playerIds[1]).length > 0;

    return player1Ready && player2Ready;
  }

  /**
   * 각 클라이언트로 전송할 위치 동기화 패킷을 작성
   * @param {string} userId
   * @param {string} opponentId
   * @return {{userPacket: Buffer, opponentPacket: Buffer}}
   */
  createLocationSyncPacket(userId, opponentId) {
    // 해당 게임의 모든 동기화 위치값 (Queue의 첫 번째 항목)
    const { unitPositions: userSyncPositions } = this.positionsToSync.get(userId)[0];
    const { unitPositions: opponentSyncPositions } = this.positionsToSync.get(opponentId)[0];

    // 1. User 패킷 작성
    const userPacketData = { unitPositions: [] };

    // 본인 (User) 소유의 유닛은 위치가 보정된 경우에만 전송
    for (const userSyncPosition of userSyncPositions) {
      if (userSyncPosition.modified) {
        const { unitId, position } = userSyncPosition;
        userPacketData.unitPositions.push({ unitId, position });
      }
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
      if (opponentSyncPosition.modified) {
        const { unitId, position } = opponentSyncPosition;
        opponentPacketData.unitPositions.push({ unitId, position });
      }
    }

    // 상대방 (User) 소유의 유닛은 전부 전송
    for (const userSyncPosition of userSyncPositions) {
      const { unitId, position } = userSyncPosition;
      opponentPacketData.unitPositions.push({ unitId, position });
    }

    return { userPacketData, opponentPacketData };
  }

  /**
   * 서버 내 유닛 객체들의 위치값 및 목적지 업데이트
   * @param {net.Socket} socket
   */
  moveUnits(socket) {
    const { userId, opponentId, userGameData, opponentGameData } = checkSessionInfo(socket);

    // 동기화 후 유닛들의 새로운 위치값 (Queue의 첫 번째 항목)
    const { unitPositions: userSyncPositions, timestamp: userTimestamp } =
      this.positionsToSync.get(userId)[0];
    const { unitPositions: opponentSyncPositions, timestamp: opponentTimestamp } =
      this.positionsToSync.get(opponentId)[0];

    // 유저 소유 유닛 업데이트
    for (const userSyncPosition of userSyncPositions) {
      const { unitId, position } = userSyncPosition;
      const unit = userGameData.getUnit(unitId);
      unit.move(position, userTimestamp);
    }
    // 상대방 소유 유닛 업데이트
    for (const opponentSyncPosition of opponentSyncPositions) {
      const { unitId, position } = opponentSyncPosition;
      const unit = opponentGameData.getUnit(unitId);
      unit.move(position, opponentTimestamp);
    }
  }

  /**
   * 위치 동기화 완료 후 서버에 저장한 동기화 위치값을 삭제
   */
  deleteSyncPositions() {
    this.positionsToSync.get(this.playerIds[0]).shift();
    this.positionsToSync.get(this.playerIds[1]).shift();
  }
}

export default LocationSyncManager;
