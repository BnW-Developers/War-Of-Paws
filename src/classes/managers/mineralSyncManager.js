import {
  INITIAL_MINERAL_RATE,
  MINERAL_SYNC_INTERVAL,
  OCCUPY_ONE_CHECKPOINT_MINERAL_RATE,
  OCCUPY_TWO_CHECKPOINT_MINERAL_RATE,
} from '../../constants/game.constants.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import PlayerGameData from '../models/playerGameData.class.js';
import CheckPointManager from './CheckPointManager.class.js';

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
   * @param {int32} checkpointCount
   * @returns {int32} - 계산된 미네랄 레이트
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
   * @param {Array<PlayerGameData>} players
   * @param {CheckPointManager} checkpointManager
   */
  updateMineral(players, checkpointManager) {
    players.forEach((playerGameData) => {
      const occupiedCheckPoint = checkpointManager.getOccupiedCheckPointsByPlayer(playerGameData);

      const mineralRateMap = {
        0: INITIAL_MINERAL_RATE,
        1: OCCUPY_ONE_CHECKPOINT_MINERAL_RATE,
        2: OCCUPY_TWO_CHECKPOINT_MINERAL_RATE,
      };

      // 점령된 거점 수에 해당하는 미네랄 레이트 가져오기
      const mineralRate = mineralRateMap[occupiedCheckPoint] || INITIAL_MINERAL_RATE;
      
      playerGameData.addMineral(mineralRate); // 미네랄 추가
    });
  }

  /**
   * 미네랄 동기화 루프 시작
   * @param {Array<PlayerGameData>} players
   * @param {CheckPointManager} checkpointManager
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
