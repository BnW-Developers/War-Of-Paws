import { ASSET_TYPE } from '../../constants/assets.js';
import {
  INITIAL_BASE_HP,
  INITIAL_MINERAL,
  INITIAL_MINERAL_RATE,
} from '../../constants/game.constants.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import Unit from './unit.class.js';

// 유저의 게임 데이터를 담는 클래스
class PlayerGameData {
  constructor(userInstance) {
    this.userId = userInstance.userId;
    this.socket = userInstance.socket;

    // TODO: 데이터 테이블에서 가져오도록 수정
    // 기본 상태 하드코딩
    this.mineral = INITIAL_MINERAL;
    this.mineralRate = INITIAL_MINERAL_RATE;
    this.buildings = [];
    this.units = new Map();
    this.baseHp = INITIAL_BASE_HP;
    this.capturedCheckPoints = [];
  }

  addUnit(gameSession, assetId, toTop, spawnTime) {
    const unitData = getGameAssetById(ASSET_TYPE.UNIT, assetId);
    if (!unitData) {
      throw new CustomErr(ERR_CODES.ASSET_NOT_FOUND, `Invalid assetId: ${assetId}`);
    }

    const unitId = gameSession.generateUnitId();
    const unit = new Unit(unitId, unitData, toTop, spawnTime);

    this.units.set(unitId, unit);
    return unitId;
  }

  spendMineral(newMineral) {
    this.mineral -= newMineral;
    return this.mineral;
  }

  setMineral(newMineral) {
    this.mineral = Math.max(0, newMineral);
  }

  addMineral(newMineral) {
    this.mineral += newMineral;
  }

  getMineral() {
    return this.mineral;
  }

  getMineralRate() {
    return this.mineralRate;
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

  // 체크포인트 removeUser 시 유닛의 위치 정보를 얻기 위한 메서드
  getUnitToTop(unitId) {
    const unit = this.getUnit(unitId);
    return unit.getToTop();
  }

  removeUnit(unitId) {
    return this.units.delete(unitId);
  }
}

export default PlayerGameData;
