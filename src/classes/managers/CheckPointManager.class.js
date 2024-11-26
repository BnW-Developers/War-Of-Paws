import CheckPoint from '../models/CheckPoint.class.js';

class CheckPointManager {
  #topPoint;
  #bottomPoint;
  constructor(playerA, playerB) {
    this.playerA = playerA; // removeUnit 시 메서드를 사용하기 위해 player.units -> player 객체
    this.playerB = playerB;
    this.#topPoint = new CheckPoint(playerA, playerB, true); // 플레이어 A 객체, 플레이어 B 객체, top 여부
    this.#bottomPoint = new CheckPoint(playerA, playerB, false);
  }

  // 검증 과정에서 에러처리 하기 위해 소켓 추가
  addUnit(socket, isTop, unitId) {
    const units = [this.playerA.units, this.playerB.units];
    const team = units[0].has(unitId) ? 0 : 1; // 추가된 유닛이 누구 팀의 것인지 확인
    const checkPoint = isTop ? this.#topPoint : this.#bottomPoint; // isTop에 따른 체크포인트 인스턴스 선택

    checkPoint.modifyUnit(team, unitId, 'add'); // 체크포인트에 유닛 추가
  }

  // 검증 과정에서 에러처리 하기 위해 소켓 추가
  removeUnit(socket, unitId) {
    const units = [this.playerA.units, this.playerB.units];
    const team = units[0].has(unitId) ? 0 : 1; // 추가된 유닛이 누구 팀의 것인지 확인
    const isTop = team ? this.playerB.getUnitToTop(unitId) : this.playerA.getUnitToTop(unitId); // 유닛 정보에서 위치 받아옴
    const checkPoint = isTop ? this.#topPoint : this.#bottomPoint;

    checkPoint.modifyUnit(team, unitId, 'remove');
  }
}

export default CheckPointManager;
