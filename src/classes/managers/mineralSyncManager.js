import {
  INITIAL_MINERAL_RATE,
  MINERAL_SYNC_INTERVAL,
  OCCUPY_ONE_CHECKPOINT_MINERAL_RATE,
  OCCUPY_TWO_CHECKPOINT_MINERAL_RATE,
} from '../../constants/game.constants.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { sendPacket } from '../../utils/packet/packetManager.js';

class MineralSyncManager {
  constructor() {
    this.timer = null; // 단일 타이머
  }

  // players -> playerGameData배열
  updateMineral(players, checkpointManager) {
    players.forEach((playerGameData) => {
      const occurredCheckPoint = checkpointManager.getOccupiedCheckPointsByPlayer(playerGameData);

      const mineralRateMap = {
        0: INITIAL_MINERAL_RATE,
        1: OCCUPY_ONE_CHECKPOINT_MINERAL_RATE,
        2: OCCUPY_TWO_CHECKPOINT_MINERAL_RATE,
      };

      // 점령된 거점 수에 해당하는 미네랄 레이트 가져오기
      const mineralRate = mineralRateMap[occurredCheckPoint] || INITIAL_MINERAL_RATE;

      // 미네랄 적용
      playerGameData.addMineral(mineralRate);
    });
  }

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
