import { ASSET_TYPE, DIRECTION, SPELL_TYPE_REVERSED } from '../../constants/assets.js';
import {
  INITIAL_BASE_HP,
  INITIAL_MINERAL,
  INITIAL_MINERAL_RATE,
  SPELL_COOLDOWN_ERROR_MARGIN,
} from '../../constants/game.constants.js';
import Game from './game.class.js'; // eslint-disable-line
import { getGameAssetById, initializeSpells } from '../../utils/assets/getAssets.js';
import logger from '../../utils/log/logger.js';
import Unit from './unit.class.js';
import { SPELL_TYPE } from '../../constants/assets.js';
import isWithinRange from '../../utils/spell/isWithinRange.js';
import initializeSpellPacketData from '../../utils/spell/spellPacket.js';
import identifyTarget from '../../utils/unit/identifyTarget.js';
import applySpell from '../../utils/spell/applySpell.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';

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

    this.baseHp = INITIAL_BASE_HP;
    this.capturedCheckPoints = [];

    /**
     * @type { Map<SPELL_TYPE, { damage?: number, healAmount?: number, buffAmount?: number, duration?: number, range: number, cost: number, cooldown: number, lastSpellTime: timestamp }> } 스펠 데이터
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
   */
  checkSpellCooldown(spellType, timestamp) {
    const spell = this.getSpellData(spellType);

    const elapsed = timestamp - spell.lastSpellTime; // 경과 시간 계산
    const requiredTime = spell.cooldown - SPELL_COOLDOWN_ERROR_MARGIN; // 쿨타임 기준 계산

    // 쿨타임이 안된다면 로그 출력 & false 반환
    if (elapsed < requiredTime) {
      throw new CustomErr(
        ERR_CODES.SPELL_ON_COOLDOWN,
        `아직 ${SPELL_TYPE_REVERSED[spellType]} 스펠을 사용할 수 없습니다` +
          ` (남은 시간: ${requiredTime - elapsed}ms)`,
      );
    }
  }

  /**
   * 스펠 쿨타임을 초기화
   * @param {SPELL_TYPE} spellType 사용할 스펠타입
   * @param {int64} timestamp 스펠 시전시간
   */
  resetLastSpellTime(spellType, timestamp) {
    const spell = this.getSpellData(spellType);
    spell.lastSpellTime = timestamp;
  }

  /**
   * 스펠 데이터를 반환
   *
   * 호출 예시: `const { buffAmount, range, duration, cost } = userGameData.getSpellData(SPELL_DATA.BUFF);`
   * @param {SPELL_TYPE} spellType 사용할 스펠타입
   * @returns {{ damage?: number, healAmount?: number, buffAmount?: number, duration?: number, range: number, cost: number, cooldown: number, lastSpellTime: timestamp }} 스펠 데이터
   */
  getSpellData(spellType) {
    const spell = this.spells.get(spellType);
    if (!spell) {
      throw new Error(`잘못된 스펠 타입입니다: ${spellType}`);
    }

    return spell;
  }

  /**
   * 스펠을 사용하고 결과 패킷 데이터 반환
   *
   * 호출 예시:
   * - `const sessionInfo = { gameSession, userGameData, opponentGameData };`
   * - 공격 스펠:
   *   - `const { spellPacketData, unitDeathPacketData } = userGameData.castSpell(SPELL_TYPE.ATTACK, centerPos, unitIds, timestamp, sessionInfo);`
   * - 버프 스펠:
   *   - `const { spellPacketData } = userGameData.castSpell(SPELL_TYPE.BUFF, centerPos, unitIds, timestamp, sessionInfo);`
   * @param {SPELL_TYPE} spellType 스펠 타입
   * @param {{ x: float, z: float }} centerPos 스펠시전 위치
   * @param {int32[]} unitIds 타겟 유닛ID
   * @param {int64} timestamp 타임스탬프
   * @param {{ gameSession: Game, userGameData: PlayerGameData, opponentGameData: PlayerGameData }} sessionInfo 세션 정보
   * @returns {{ spellPacketData: {}, unitDeathPacketData?: {} }} 결과 패킷 데이터
   */
  castSpell(spellType, centerPos, unitIds, timestamp, sessionInfo) {
    // 스펠 대상 (true: 적 대상 / false: 아군 대상 )
    const isOffensive =
      spellType === SPELL_TYPE.ATTACK || spellType === SPELL_TYPE.STUN ? true : false;

    // 스펠 데이터 조회
    const spell = this.getSpellData(spellType);

    // 전송할 패킷 데이터
    const packetData = initializeSpellPacketData(spellType);

    // 검증: 스펠 쿨타임
    this.checkSpellCooldown(spellType, timestamp);

    // 스펠 쿨타임 초기화
    this.resetLastSpellTime(spellType, timestamp);

    // 검증: 소모할 자원
    const spellCost = spell.cost;
    if (this.getMineral() < spellCost) {
      throw new CustomErr(
        ERR_CODES.SPELL_INSUFFICIENT_FUNDS,
        '스펠을 사용하기 위한 자원이 부족합니다',
      );
    }

    // 자원 소모
    this.spendMineral(spellCost);

    // 대상 유닛 처리
    for (const unitId of unitIds) {
      // 검증: 피아식별
      const targetUnit = identifyTarget(unitId, isOffensive, sessionInfo);

      // 검증: 스펠 사정거리
      if (isWithinRange(targetUnit, centerPos, spell.range, spellType)) {
        applySpell(targetUnit, spellType, spell, packetData, sessionInfo);
      }
    }

    // 결과 패킷 데이터 반환
    return packetData;
  }

  getBaseHp() {
    return this.baseHp;
  }
}

export default PlayerGameData;
