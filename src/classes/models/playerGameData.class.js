import { ASSET_TYPE } from '../../constants/assets.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
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

  addUnit(assetId, toTop) {
    const unitData = getGameAssetById(ASSET_TYPE.UNIT, assetId);
    if (!unitData) {
      throw new CustomErr(ERR_CODES.ASSET_NOT_FOUND, `Invalid assetId: ${assetId}`);
    }

    const newUnit = new Unit(unitData, toTop);
    const unitId = newUnit.getUnitId();
    this.units.set(unitId, newUnit);
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

  spendMineral(mineral) {
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

  attackBase(damage) {
    const newBaseHp = this.baseHp - damage;
    this.baseHp = newBaseHp > 0 ? newBaseHp : 0;
    return this.baseHp;
  }

  getUnit(unitId) {
    return this.units.get(unitId);
  }

  removeUnit(unitId) {
    return this.units.delete(unitId);
  }
}

export default PlayerGameData;
