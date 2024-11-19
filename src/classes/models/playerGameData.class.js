import Unit from './unit.class.js';

// 유저의 게임 데이터를 담는 클래스
class PlayerGameData {
  constructor(userInstance) {
    this.userId = userInstance.userId;
    this.socket = userInstance.socket;

    // TODO: 데이터 테이블에서 가져오도록 수정
    // 기본 상태 하드코딩
    this.minerals = 100;
    this.mineralRate = 1;
    this.buildings = [];
    this.units = new Map();
    this.baseHp = 1000;
    this.capturedCheckPoints = [];
  }

  addUnit(assetId, toTop) {
    const unit = new Unit(assetId, toTop);
    const unitId = unit.getUnitId();
    this.units.set(unitId, unit);
  }

  getUnit(unitId) {
    return this.units.get(unitId);
  }

  removeUnit(unitId) {
    return this.units.delete(unitId);
  }
}

export default PlayerGameData;
