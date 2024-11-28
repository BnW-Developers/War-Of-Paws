import { DIRECTION } from '../../constants/assets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import CheckPoint from '../models/CheckPoint.class.js';

class CheckPointManager {
  #topPoint;
  #bottomPoint;
  #checkpointUnits;
  constructor(playerA, playerB) {
    this.playerA = playerA; // removeUnit 시 메서드를 사용하기 위해 player.units -> player 객체
    this.playerB = playerB;
    this.#checkpointUnits = new Map(); // 체크포인트 유닛 여부 관리용 맵
    this.#topPoint = new CheckPoint(playerA, playerB, true); // 플레이어 A 객체, 플레이어 B 객체, top 여부
    this.#bottomPoint = new CheckPoint(playerA, playerB, false);
  }

  addUnit(unitId) {
    const units = [this.playerA.units, this.playerB.units];
    const team = units[0].has(unitId) ? 0 : 1; // 추가된 유닛이 누구 팀의 것인지 확인
    // 검증 : addUnit 하고자 하는 unitId가 두 플레이어 모두에게 없을 경우.
    if (team === 1 && !units[1].has(unitId))
      throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, '점령 진입한 유닛에 대한 정보가 없습니다.');

    const direction = team
      ? this.playerB.getUnitDirection(unitId)
      : this.playerA.getUnitDirection(unitId); // 유닛 정보에서 위치 받아옴

    const checkPoint = direction === DIRECTION.UP ? this.#topPoint : this.#bottomPoint; // direction에 따른 체크포인트 인스턴스 선택

    checkPoint.modifyUnit(team, unitId, 'add'); // 체크포인트에 유닛
    this.#checkpointUnits.set(unitId, { direction, team }); // 체크포인트 유닛 여부 관리용
  }

  removeUnit(unitId) {
    const { direction, team } = this.getCheckPointUnits(unitId);
    const checkPoint = direction === DIRECTION.UP ? this.#topPoint : this.#bottomPoint;
    checkPoint.modifyUnit(team, unitId, 'remove');
    this.#checkpointUnits.delete(unitId);
  }

  isExistUnit(unitId) {
    return this.#checkpointUnits.has(unitId);
  }

  getCheckPointUnits(unitId) {
    return this.#checkpointUnits.get(unitId);
  }

  getCheckPointState(unitId) {
    const { direction, team } = this.getCheckPointUnits(unitId);
    const checkPoint = direction === DIRECTION.UP ? this.#topPoint : this.#bottomPoint;
    const status = checkPoint.getStatus();

    return `occupied${team}` === status;
  }

  delete() {
    console.log('체크매니저 딜리트 진행');
    this.#topPoint.delete();
    this.#bottomPoint.delete();
  }
}

export default CheckPointManager;
