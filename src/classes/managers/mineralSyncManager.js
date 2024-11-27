import { MINERAL_SYNC_INTERVAL } from '../../constants/game.constants.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { sendPacket } from '../../utils/packet/packetManager.js';

class MineralSyncManager {
  constructor() {
    this.timer = null; // 단일 타이머
  }

  updateMineral(players) {
    players.forEach((playerGameData) => {
      const intervalSeconds = Math.floor(MINERAL_SYNC_INTERVAL / 1000); // 인터벌 seconds 변환

      // 미네랄 현황 가져옴
      const mineralRate = playerGameData.getMineralRate();

      // 증가할 미네랄 계산
      const mineralToAdd = mineralRate * intervalSeconds; // 미네랄 증가율 * 인터벌(3초)

      // 미네랄 적용
      playerGameData.addMineral(mineralToAdd);
    });
  }

  startSyncLoop(players) {
    const interval = MINERAL_SYNC_INTERVAL;

    // 기존 타이머가 있다면 제거
    this.stopSyncLoop();

    this.timer = setInterval(() => {
      this.updateMineral(players);

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
