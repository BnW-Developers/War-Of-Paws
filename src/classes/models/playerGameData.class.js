import Unit from './unit.class.js';
import logger from '../../utils/logger.js';


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

  addUnit(assetId, attack, hp, toTop, position) {
    const unitId = this.generateUnitId();

    const newUnit = {
      assetId, // 유닛 종류
      unitId, // 유닛 인스턴스 id
      ownerId: this.userId, // 소유한 유저의 id
      attack,
      hp,
      toTop,
      position,
    };

    this.units.push(newUnit);
    return unitId; // 생성된 유닛의 ID 반환
  }

  removeUnit(unitId) {
    const unitIndex = this.units.findIndex((unit) => unit.unitId === unitId);

    if (unitIndex === -1) {
      // 유닛을 찾을 수 없을 때 처리
      logger.warn(`Unit with ID ${unitId} not found`);
      return false; // 실패
    }

    this.units.splice(unitIndex, 1); // 유닛 제거
    return true; // 성공
  }

  getUnitById(unitId) {
    const unit = this.units.find((unit) => unit.unitId === unitId);

    if (!unit) {
      logger.warn(`Unit with ID ${unitId} not found`);
      return null; // 유닛이 없으면 null 반환
    }

    return unit; // 유닛 객체 반환
  }

  getUserId() {
    return this.userId;
  }

  getSocket() {
    return this.socket;
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
