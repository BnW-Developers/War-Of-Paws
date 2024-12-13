import Game from '../../classes/models/game.class.js'; // eslint-disable-line
import PlayerGameData from '../../classes/models/playerGameData.class.js'; // eslint-disable-line
import Unit from '../../classes/models/unit.class.js'; // eslint-disable-line
import logger from '../log/logger.js';
import { LOG_ENABLED_UNIT_ALREADY_DEAD } from '../log/logSwitch.js';

/**
 * 유닛 사망처리에 필요한 공정을 진행
 * @param {Unit} unit
 * @param {Game} gameSession
 * @param {PlayerGameData} gameData
 * @param {{unitIds: {unitId: int32}[]}} packetData
 */
const processDeath = (unit, gameSession, gameData, packetData) => {
  // 검증: 중복 사망처리
  if (unit.isDead()) {
    if (LOG_ENABLED_UNIT_ALREADY_DEAD) logger.info(`Unit ${unitId} is already dead.`);
    return;
  }
  const unitId = unit.getUnitId();

  // 사망 플래그 설정
  unit.markAsDead();

  // 점령지 현황 업데이트
  const checkPointManager = gameSession.getCheckPointManager();
  if (checkPointManager.isExistUnit(unitId)) {
    checkPointManager.removeUnit(unitId);
  }

  // 서버 내 유닛 데이터 삭제
  gameData.removeUnit(unitId);

  // 패킷에 사망한 유닛ID 추가
  packetData.unitIds.push({ unitId });
};

export default processDeath;
