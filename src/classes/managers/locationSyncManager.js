import { MAX_PLAYERS } from '../../constants/game.constants.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
class LocationSyncManager {
  constructor() {
    // 동기화에 사용될 위치값 초기화
    this.positionsToSync = new Map();
  }

  /**
   * 동기화에 사용될 위치값 업데이트
   * @param {string} userId
   * @param {int32} timestamp
   * @param {{unitId: int32, position: {x: float, y: float, z: float}, modified: boolean}[]} unitPositions
   */
  addSyncPositions(userId, timestamp, unitPositions) {
    // 검증: 이미 기록한 위치값인가?
    if (this.positionsToSync.has(userId)) {
      throw new Error('이미 해당 클라이언트의 위치값을 기록했습니다: userid', userId);
    }

    // 검증: 최대 플레이어 수를 초과하는가?
    if (this.positionsToSync.size === MAX_PLAYERS) {
      throw new Error(`플레이어 정원을 초과하였습니다.`);
    }

    // 해당 유저의 동기화 위치값 저장
    this.positionsToSync.set(userId, { timestamp, unitPositions });
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
   * @return {{userPacket: Buffer, opponentPacket: Buffer}}
   */
  createLocationSyncPacket(userId, opponentId) {
    // 해당 게임의 모든 동기화 위치값
    const { unitPositions: userSyncPositions } = this.positionsToSync.get(userId);
    const { unitPositions: opponentSyncPositions } = this.positionsToSync.get(opponentId);

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
   * 서버 내 유닛 객체들의 위치값 및 목적지 업데이트
   * @param {net.Socket} socket
   */
  moveUnits(socket) {
    const { userId, opponentId, userGameData, opponentGameData } = checkSessionInfo(socket);

    // 동기화 후 유닛들의 새로운 위치값
    const { unitPositions: userSyncPositions, timestamp: userTimestamp } =
      this.positionsToSync.get(userId);
    const { unitPositions: opponentSyncPositions, timestamp: opponentTimestamp } =
      this.positionsToSync.get(opponentId);

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
   * 위치 동기화 완료 후 서버에 저장한 동기화 위치값을 리셋
   */
  resetSyncPositions() {
    this.positionsToSync = new Map();
  }
}

export default LocationSyncManager;
