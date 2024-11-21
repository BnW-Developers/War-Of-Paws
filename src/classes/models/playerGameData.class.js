import logger from '../../utils/logger.js';
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

    this.unitIdCounter = 0;
  }

  generateUnitId() {
    this.unitIdCounter += 1;
    return this.unitIdCounter;
  }

  // TODO: load JSON 업데이트 되면 인자로 unitData 객체 받아서 unit Class 생성
  addUnit(assetId, attack, hp, toTop, position) {
    // 여기에 unitData 생성자에 넣어주기
    const unit = new Unit(assetId, toTop);
    const unitId = unit.getUnitId();
    this.units.set(unitId, unit);
    return unitId;
  }

  getUnitById(unitId) {
    const unit = this.units.find((unit) => unit.unitId === unitId);

    if (!unit) {
      logger.warn(`Unit with ID ${unitId} not found`);
      return null; // 유닛이 없으면 null 반환
    }

    return unit; // 유닛 객체 반환
  }

  spentMineral(mineral) {
    this.minerals -= mineral;
    return this.minerals;
  }

  getMineral() {
    return this.minerals;
  }

  addBuilding(assetId) {
    this.buildings.push(assetId);
  }

  getUserId() {
    return this.userId;
  }

  getSocket() {
    return this.socket;
  }

  getUnit(unitId) {
    return this.units.get(unitId);
  }

  removeUnit(unitId) {
    return this.units.delete(unitId);
  }
}

export default PlayerGameData;
