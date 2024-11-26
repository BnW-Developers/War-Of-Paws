import CheckPoint from '../models/CheckPoint.class.js';

class CheckPointManager {
  #topPoint;
  #bottomPoint;
  constructor(playerA, playerB) {
    this.unitsA = playerA.units; // 추가된 유닛이 누구 팀의 것인지 확인하기 위한 변수
    this.unitsB = playerB.units;
    this.#topPoint = new CheckPoint(playerA, playerB, true); // 플레이어 A 객체, 플레이어 B 객체, top 여부
    this.#bottomPoint = new CheckPoint(playerA, playerB, false);
  }
  addUnit(isTop, unit) {
    const checkPoint = isTop ? this.#topPoint : this.#bottomPoint; // isTop에 따른 체크포인트 인스턴스 선택
    const team = this.unitsA.has(unit) ? 0 : 1; // 추가된 유닛이 누구 팀의 것인지 확인
    checkPoint.modifyUnit(team, unit, 'add'); // 체크포인트에 유닛 추가
  }

  removeUnit(isTop, unit) {
    const checkPoint = isTop ? this.#topPoint : this.#bottomPoint;
    const team = this.unitsA.includes(unit) ? 0 : 1;
    checkPoint.modifyUnit(team, unit, 'remove');
  }
}

export default CheckPointManager;
