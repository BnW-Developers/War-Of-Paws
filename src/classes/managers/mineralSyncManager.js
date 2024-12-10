import {
  INITIAL_MINERAL_RATE,
  MINERAL_SYNC_INTERVAL,
  OCCUR_ONE_CHECKPOINT_MINERAL_RATE,
  OCCUR_TWO_CHECKPOINT_MINERAL_RATE,
} from '../../constants/game.constants.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { sendPacket } from '../../utils/packet/packetManager.js';

/**
 * 미네랄 동기화 클래스
 * - 플레이어의 점령된 거점에 따라 미네랄을 동기화
 * - 일정 주기로 미네랄을 갱신 및 클라이언트에 알림
 */
class MineralSyncManager {
  constructor() {
    this.timer = null;
  }

  /**
   * 플레이어의 점령된 거점 수에 따른 미네랄 레이트 계산
   * @param {number} checkpointCount - 점령된 거점 수
   * @returns {number} - 계산된 미네랄 레이트
   */
  getMineralRate(checkpointCount) {
    const mineralRateMap = {
      0: INITIAL_MINERAL_RATE,
      1: OCCUR_ONE_CHECKPOINT_MINERAL_RATE,
      2: OCCUR_TWO_CHECKPOINT_MINERAL_RATE,
    };
    return mineralRateMap[checkpointCount] || INITIAL_MINERAL_RATE;
  }

  /**
   * 미네랄 동기화 업데이트
   * @param {Array<Object>} players - 플레이어 게임 데이터 배열
   * @param {Object} checkpointManager - 체크포인트 매니저
   */
  updateMineral(players, checkpointManager) {
    players.forEach((playerGameData) => {
      const checkpointCount = checkpointManager.getOccupiedCheckPointsByPlayer(playerGameData);
      const mineralRate = this.getMineralRate(checkpointCount);

      playerGameData.addMineral(mineralRate); // 미네랄 추가
    });
  }

  /**
   * 미네랄 동기화 루프 시작
   * @param {Array<Object>} players - 플레이어 게임 데이터 배열
   * @param {Object} checkpointManager - 체크포인트 매니저
   */
  startSyncLoop(players, checkpointManager) {
    const interval = MINERAL_SYNC_INTERVAL;

    // 기존 타이머가 있다면 제거
    this.stopSyncLoop();

    this.timer = setInterval(() => {
      this.updateMineral(players, checkpointManager);

      players.forEach((playerGameData) => {
        const socket = playerGameData.getSocket();
        const mineral = playerGameData.getMineral();

        // 미네랄 동기화 알림 전송
        sendPacket(socket, PACKET_TYPE.MINERAL_SYNC_NOTIFICATION, { mineral });
      });
    }, interval); // n초마다 실행
  }

  /**
   * 미네랄 동기화 루프 중지
   */
  stopSyncLoop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export default MineralSyncManager;
