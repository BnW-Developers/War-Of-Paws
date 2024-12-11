import { ASSET_TYPE, DIRECTION } from '../../constants/assets.js';
import {
  INITIAL_BASE_HP,
  INITIAL_MINERAL,
  INITIAL_MINERAL_RATE,
} from '../../constants/game.constants.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import Game from './game.class.js';
import Unit from './unit.class.js';

/**
 * 유저의 게임 데이터를 관리하는 클래스
 */
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

  /**
   * 유닛을 추가하는 메서드
   * @param {Game} gameSession
   * @param {int32} assetId
   * @param {boolean} toTop
   * @param {int64} spawnTime
   * @returns {int32} 생성된 유닛 ID
   */
  addUnit(gameSession, assetId, toTop, spawnTime) {
    const unitId = gameSession.generateUnitId();
    const unitData = getGameAssetById(ASSET_TYPE.UNIT, assetId);
    const direction = toTop ? DIRECTION.UP : DIRECTION.DOWN;

    const unit = new Unit(unitId, unitData, direction, spawnTime);

    this.units.set(unitId, unit);
    return unitId;
  }

  /**
   * 미네랄 소비
   * @param {int32} newMineral
   * @returns {int32} 남은 보유 미네랄
   */
  spendMineral(newMineral) {
    this.mineral -= newMineral;
    return this.mineral;
  }

  /**
   * 미네랄 추가
   * @param {int32} newMineral
   */
  addMineral(newMineral) {
    this.mineral += newMineral;
  }

  /**
   * 현재 미네랄 반환
   * @returns {int32}
   */
  getMineral() {
    return this.mineral;
  }

  /**
   * 미네랄 획득 속도 반환
   * @returns {int32}
   */
  getMineralRate() {
    return this.mineralRate;
  }

  /**
   * 건물을 추가
   * @param {int32} assetId
   */
  addBuilding(assetId) {
    this.buildings.push(assetId);
  }

  /**
   * 유저 ID 반환
   * @returns {int32}
   */
  getUserId() {
    return this.userId;
  }

  /**
   * 유저 소켓 반환
   * @returns {net.Socket}
   */
  getSocket() {
    return this.socket;
  }

  /**
   * 유저의 베이스에 데미지를 입힘
   * @param {int32} damage
   * @returns {int32} 남은 체력
   */
  attackBase(damage) {
    const newBaseHp = this.baseHp - damage;
    this.baseHp = newBaseHp > 0 ? newBaseHp : 0;
    return this.baseHp;
  }

  /**
   * 특정 유닛 반환
   * @param {int32} unitId
   * @returns {Unit}
   */
  getUnit(unitId) {
    return this.units.get(unitId);
  }

  /**
   * 특정 건물이 구매되었는지 확인
   * @param {int32} assetId
   * @returns {boolean}
   */
  isBuildingPurchased(assetId) {
    return this.buildings.includes(assetId);
  }

  /**
   * 체크포인트 removeUser 시 유닛의 위치 정보를 얻기 위한 메서드
   * @param {int32} unitId
   * @returns {string}
   */
  getUnitDirection(unitId) {
    const unit = this.getUnit(unitId);
    return unit.getDirection();
  }

  /**
   * 유닛 제거
   * @param {int32} unitId
   * @returns {boolean}
   */
  removeUnit(unitId) {
    return this.units.delete(unitId);
  }
}

export default PlayerGameData;
