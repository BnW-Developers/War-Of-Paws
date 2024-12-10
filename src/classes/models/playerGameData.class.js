import { ASSET_TYPE, DIRECTION } from '../../constants/assets.js';
import {
  INITIAL_BASE_HP,
  INITIAL_MINERAL,
  INITIAL_MINERAL_RATE,
} from '../../constants/game.constants.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import logger from '../../utils/logger.js';
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
    this.cards = new Map(); // 8칸짜리 인벤토리 assetId(key) - 수량(value)
    this.baseHp = INITIAL_BASE_HP;
    this.capturedCheckPoints = [];
  }

  addUnit(gameSession, assetId, toTop, spawnTime) {
    // TODO: 카드 관련 로직

    const unitId = gameSession.generateUnitId();
    const unitData = getGameAssetById(ASSET_TYPE.UNIT, assetId);
    const direction = toTop ? DIRECTION.UP : DIRECTION.DOWN;

    const unit = new Unit(unitId, unitData, direction, spawnTime);

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
  getUnitDirection(unitId) {
    const unit = this.getUnit(unitId);
    return unit.getDirection();
  }

  removeUnit(unitId) {
    return this.units.delete(unitId);
  }

  addCard(assetId) {
    const currentCount = this.cards.get(assetId) || 0;
    this.cards.set(assetId, currentCount + 1);
  }

  getCardCount() {
    let totalCount = 0;
    for (const count of this.cards.values()) {
      totalCount += count;
    }
    return totalCount;
  }

  removeCard(assetId, count = 1) {
    const currentCount = this.cards.get(assetId) || 0;

    if (currentCount < count) {
      logger.warn(`Not enough cards to remove for assetId ${assetId}`);
      throw new Error(`Not enough cards to remove for assetId ${assetId}`);
    }

    if (currentCount === count) {
      this.cards.delete(assetId);
    } else {
      this.cards.set(assetId, currentCount - count);
    }
  }

  checkEliteCard(assetId) {
    if (this.cards.get(assetId) >= 3) {
      return true;
    }
    return null;
  }

  addEliteCard(assetId) {
    const unitData = getGameAssetById(ASSET_TYPE.UNIT, assetId);
    const eliteAssetId = unitData.eliteId;

    if (!eliteAssetId) {
      logger.warn(`No eliteId defined for assetId ${assetId}`);
      throw new Error(`No eliteId defined for assetId ${assetId}`);
    }

    this.removeCard(assetId, 3); // 합성에 사용된 3장의 카드 제거

    this.addCard(eliteAssetId);

    return eliteAssetId;
  }
}

export default PlayerGameData;
