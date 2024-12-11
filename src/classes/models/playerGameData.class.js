import { ASSET_TYPE, DIRECTION, SPELL_TYPE_REVERSED } from '../../constants/assets.js';
import {
  INITIAL_BASE_HP,
  INITIAL_MINERAL,
  INITIAL_MINERAL_RATE,
  SPELL_COOLDOWN_ERROR_MARGIN,
} from '../../constants/game.constants.js';
import { getGameAssetById, initializeSpells } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import logger from '../../utils/log/logger.js';
import Unit from './unit.class.js';
import { SPELL_TYPE } from '../../constants/assets.js'; // eslint-disable-line

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

    /**
     * @type { Map<SPELL_TYPE, { damage?: number, healAmount?: number, atkUp?: number, duration?: number, range: number, cost: number, cooldown: number, lastSpellTime: timestamp }> } 스펠 데이터
     */
    this.spells = initializeSpells();
  }

  addUnit(gameSession, assetId, toTop, spawnTime) {
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

  /**
   * 스펠 쿨타임 대기중인지 확인
   * @param {SPELL_TYPE} spellType 사용할 스펠타입
   * @param {int64} timestamp 스펠 시전시간
   * @returns {boolean}
   */
  isSpellAvailable(spellType, timestamp) {
    // 검증: 스펠 타입
    const spell = this.spells.get(spellType);
    if (!spell) {
      throw new CustomErr(ERR_CODES.INVALID_ASSET_ID, `잘못된 스펠 타입입니다: ${spellType}`);
    }

    const elapsed = timestamp - spell.lastSpellTime; // 경과 시간 계산
    const requiredTime = spell.cooldown - SPELL_COOLDOWN_ERROR_MARGIN; // 쿨타임 기준 계산

    // 쿨타임이 안된다면 로그 출력 & false 반환
    if (elapsed < requiredTime) {
      logger.info(
        `아직 ${SPELL_TYPE_REVERSED[spellType]} 스펠을 사용할 수 없습니다` +
          ` (남은 시간: ${requiredTime - elapsed}ms)`,
      );
      return false;
    }

    return true;
  }

  /**
   * 스펠 쿨타임을 초기화
   * @param {SPELL_TYPE} spellType 사용할 스펠타입
   * @param {int64} timestamp 스펠 시전시간
   */
  resetLastSpellTime(spellType, timestamp) {
    const spell = this.spells.get(spellType);
    if (!spell) {
      throw new CustomErr(ERR_CODES.INVALID_ASSET_ID, `잘못된 스펠 타입입니다: ${spellType}`);
    }

    spell.lastSpellTime = timestamp;
  }

  /**
   * 스펠 데이터를 반환
   *
   * 호출 예시: `const { atkUp, range, duration, cost } = userGameData.getSpellData(SPELL_DATA.BUFF);`
   * @param {SPELL_TYPE} spellType 사용할 스펠타입
   * @returns {{ damage?: number, healAmount?: number, atkUp?: number, duration?: number, range: number, cost: number, cooldown: number, lastSpellTime: timestamp }} 스펠 데이터
   */
  getSpellData(spellType) {
    const spell = this.spells.get(spellType);
    if (!spell) {
      throw new CustomErr(ERR_CODES.INVALID_ASSET_ID, `잘못된 스펠 타입입니다: ${spellType}`);
    }

    return spell;
  }
}

export default PlayerGameData;
