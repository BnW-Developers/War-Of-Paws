import { ASSET_TYPE, DIRECTION, SPELL_TYPE_REVERSED } from '../../constants/assets.js';
import {
  ATK_INCREMENT_PER_LEVEL,
  HP_INCREMENT_PER_LEVEL,
  INITIAL_BASE_HP,
  INITIAL_MINERAL,
  INITIAL_MINERAL_RATE,
  SPELL_COOLDOWN_ERROR_MARGIN,
} from '../../constants/game.constants.js';
import { getGameAssetById, initializeSpells } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import logger from '../../utils/log/logger.js';
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
    this.cards = new Map(); // 8칸짜리 인벤토리 assetId(key) - 수량(value)
    this.upgrades = new Map(); // 업그레이드 상태 관리 (assetId - { type: "hp", level: 1 })

    this.baseHp = INITIAL_BASE_HP;
    this.capturedCheckPoints = [];

    /**
     * @type { Map<SPELL_TYPE, { damage?: number, healAmount?: number, atkUp?: number, duration?: number, range: number, cost: number, cooldown: number, lastSpellTime: timestamp }> } 스펠 데이터
     */
    this.spells = initializeSpells();
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
    // TODO: 카드 관련 로직

    const unitId = gameSession.generateUnitId();
    // 원본 JSON 데이터를 복사하여 사용
    const copiedUnitData = { ...getGameAssetById(ASSET_TYPE.UNIT, assetId) };
    const direction = toTop ? DIRECTION.UP : DIRECTION.DOWN;

    // 업그레이드 상태 적용
    const upgradeState = this.getUpgradeState(assetId);

    const { type, level } = upgradeState;

    // 타입에 따라 스탯 상승
    if (type === 'hp') {
      copiedUnitData.maxHp += HP_INCREMENT_PER_LEVEL * level;
      copiedUnitData.hp = copiedUnitData.maxHp;
    } else if (type === 'atk') {
      copiedUnitData.atk += ATK_INCREMENT_PER_LEVEL * level;
    }

    // 엘리트 유닛이면 공격력 / 체력 3배
    if (copiedUnitData.eliteId === 'elite') {
      copiedUnitData.atk *= 3;
      copiedUnitData.maxHp *= 3;
      copiedUnitData.hp = copiedUnitData.maxHp;
    }

    const unit = new Unit(unitId, copiedUnitData, direction, spawnTime);

    this.units.set(unitId, unit);
    return unitId;
  }

  /**
   * 유닛의 업그레이드 상태 반환
   * @param {int32} assetId
   * @returns {{ type: string, level: int32 }}
   */
  getUpgradeState(assetId) {
    return this.upgrades.get(assetId);
  }

  /**
   * 업그레이드 수행
   * @param {int32} assetId normal assetId만 받음 (2천번대)
   * @param {string} upgradeType - hp 또는 atk
   * @returns {int32} level
   */
  applyUpgradeLevel(assetId, upgradeType) {
    let upgradeState = this.upgrades.get(assetId);

    // 업그레이드가 안되어 있다면
    if (!upgradeState) {
      // 업그레이드 세팅
      upgradeState = { type: upgradeType, level: 1 };
      this.upgrades.set(assetId, upgradeState);
    } else {
      upgradeState.level += 1;
    }

    // 레벨을 업그레이드 했다면 스탯도 업데이트
    this.applyUpgradeUnits(assetId);

    return upgradeState.level;
  }

  /**
   * 필드에 존재하는 유닛들에 업그레이드된 스탯을 반영
   * @param {int32} assetId - 업그레이드 대상 유닛의 assetId
   */
  applyUpgradeUnits(assetId) {
    const upgradeState = this.upgrades.get(assetId);

    const { type, level } = upgradeState;

    this.units.forEach((unit) => {
      // unit이 존재하지 않으면 건너뜀
      if (!unit) return;

      if (unit.id === assetId) {
        // 필드에 있는 유닛들은 최대 체력만 적용? 일단 그렇게
        if (type === 'hp') {
          unit.maxHp += HP_INCREMENT_PER_LEVEL * level;
        } else if (type === 'atk') {
          const atkIncrement = ATK_INCREMENT_PER_LEVEL * level;
          unit.attackPower += atkIncrement;
        }
      }
    });
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
    const unitData = getGameAssetById(ASSET_TYPE.UNIT, assetId);

    if (unitData.eliteId === 'elite') {
      return false;
    }

    if (this.cards.get(assetId) >= 3) {
      return true;
    }

    return false;
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

  getBaseHp() {
    return this.baseHp;
  }
}

export default PlayerGameData;
