import {
  ATTACK_COOLDOWN_ERROR_MARGIN,
  INITIAL_UNIT_ROTATION,
  RANGE_ERROR_MARGIN,
  SKILL_COOLDOWN_ERROR_MARGIN,
} from '../../constants/game.constants.js';
import { getMapCorners, getPath } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import calcDist from '../../utils/location/calcDist.js';
import logger from '../../utils/log/logger.js';
import { LOG_ENABLED_UPDATE_DESTINATION } from '../../utils/log/logSwitch.js';

class Unit {
  /**
   * @param {int32} unitId
   * @param {JSON} unitData
   * @param {string} direction
   * @param {int32} spawnTime
   */
  constructor(unitId, unitData, direction, spawnTime) {
    // ID 및 종족 관련
    this.unitId = unitId;
    this.species = unitData.species;
    this.type = unitData.type;
    this.class = unitData.class;
    this.tier = unitData.tier;
    this.eliteId = unitData.eliteId;

    // 능력치 관련
    this.maxHp = unitData.maxHp;
    this.hp = unitData.maxHp;
    this.attackPower = unitData.atk;
    this.attackRange = unitData.atkRange;
    this.speed = unitData.spd;

    // 상태 관련
    this.buffed = false;
    this.stunned = false;
    this.dead = false;

    // 쿨타임 관련
    this.cooldown = unitData.cd;
    this.cost = unitData.cost;
    this.skillCooldown = unitData.skillCd;
    this.lastAttackTime = 0;
    this.lastSkillTime = 0;

    // 코스트 관련
    this.cost = unitData.cost;

    // 이동 관련
    this.direction = direction; // 체크포인트 유닛 위치 파악용
    this.path = getPath(this.species, this.direction);
    this.position = this.path[0];
    this.rotation = { y: INITIAL_UNIT_ROTATION[direction] };
    this.destinationIndex = 1;
    this.destinationPoint = this.path[this.destinationIndex];
    this.destinationArea = getMapCorners(this.species, this.direction)[0];
    this.lastTimestamp = spawnTime;
  }

  /**
   * 유닛 ID 반환
   * @returns {int32}
   */
  getUnitId() {
    return this.unitId;
  }

  /**
   * 유닛 종족 반환
   * @returns {string}
   */
  getSpecies() {
    return this.species;
  }

  /**
   * 유닛 타입 반환
   * @returns {string} "normal" / "buffer" / "healer"
   */
  getType() {
    return this.type;
  }

  getClass() {
    return this.class;
  }

  /**
   * 현재 체력 반환
   * @returns {int32}
   */
  getHp() {
    return Math.floor(this.hp);
  }

  /**
   * 유닛이 사망했는지 확인
   * @returns {boolean}
   */
  isDead() {
    return this.dead;
  }

  /**
   * 유닛을 사망 상태로 설정
   */
  markAsDead() {
    this.dead = true;
  }

  /**
   * 유닛이 버프 상태인지 확인
   * @returns {boolean}
   */
  isBuffed() {
    if (this.buffed) {
      logger.info(`Target ${this.unitId} is already buffed`);
      return true;
    }
    return false;
  }

  /**
   * 유닛 속도 반환
   * @returns {float}
   */
  getSpeed() {
    return this.speed;
  }

  /**
   * 유닛 공격력 반환
   * @returns {int32}
   */
  getAttackPower() {
    return this.attackPower;
  }

  /**
   * 유닛 공격 사거리 반환
   * @returns {float}
   */
  getAttackRange() {
    return this.attackRange;
  }

  /**
   * 유닛이 공격 가능한지 쿨타임 검증증
   * @param {int64} timestamp
   * @returns {boolean}
   */
  checkAttackCooldown(timestamp) {
    const elapsed = timestamp - this.lastAttackTime; // 경과 시간 계산
    const requiredTime = this.cooldown - ATTACK_COOLDOWN_ERROR_MARGIN; // 쿨타임 기준 계산

    // 쿨타임이 안된다면 에러 처리
    if (elapsed < requiredTime) {
      throw new CustomErr(
        ERR_CODES.ATTACK_ON_COOLDOWN,
        `유닛 (${this.unitId})이 아직 공격할 수 없습니다` +
          ` (남은 시간: ${requiredTime - elapsed}ms)`,
      );
    }
  }

  /**
   * 마지막 공격 시간을 초기화
   */
  resetLastAttackTime(timestamp) {
    this.lastAttackTime = timestamp;
  }

  /**
   * 마지막 스킬 사용 시간을 초기화
   * @param {int64} timestamp
   */
  resetLastSkillTime(timestamp) {
    this.lastSkillTime = timestamp;
  }

  /**
   * 유닛이 스킬을 사용할 수 있는지 확인
   * @param {int64} timestamp
   * @returns {boolean}
   */
  isSkillAvailable(timestamp) {
    const elapsed = timestamp - this.lastSkillTime; // 경과 시간 계산
    const requiredTime = this.skillCooldown - SKILL_COOLDOWN_ERROR_MARGIN; // 스킬 쿨다운 기준 계산

    if (elapsed < requiredTime) {
      logger.info(
        `Skill not available: Unit ID ${this.unitId}, Skill Cooldown: ${this.skillCooldown}, Remaining time: ${requiredTime - elapsed}`,
      );
      return false;
    }

    return true;
  }

  /**
   * 유닛의 체력을 감소
   * @param {int32} damage
   * @returns {float}
   */
  applyDamage(damage) {
    this.hp = Math.max(0, this.hp - damage); // 체력은 0 이하로 감소하지 않음
    return Math.floor(this.hp);
  }

  /**
   * 유닛의 체력을 회복
   * @param {int32} healAmount - 회복할 고정 체력량
   * @returns {int32} - 회복 후 유닛의 현재 체력
   */
  applyHeal(healAmount) {
    // 현재 체력에 회복량을 더하고 최대 체력을 초과하지 않도록 설정
    this.hp = Math.min(this.hp + healAmount, this.maxHp);

    return this.hp;
  }

  /**
   * 유닛에 버프를 적용
   * @param {int32} buffAmount
   * @param {int32} duration
   */
  applyBuff(buffAmount, duration) {
    const baseCooldown = this.cooldown;
    this.cooldown /= buffAmount; // 쿨타임 감소
    this.buffed = true;

    // 일정 시간 후 버프 해제
    setTimeout(() => {
      this.cooldown = baseCooldown; // 원래 쿨타임 복구
      this.buffed = false;
    }, duration);
  }

  applyStun(duration) {
    const baseSpeed = this.speed;
    this.speed = 0;
    this.stunned = true;

    // 일정 시간 후 스턴 해제
    setTimeout(() => {
      this.speed = baseSpeed;
      this.stunned = false;
    }, duration);
  }

  /**
   * 체크포인트 유닛 위치 파악용 메서드
   * @returns {string}
   */
  getDirection() {
    return this.direction;
  }

  /**
   * 유닛 위치 반환
   * @returns {{ x: float, z: float }}
   */
  getPosition() {
    return this.position;
  }

  /**
   * 유닛 회전값 반환
   * @returns {{ y: int32 }} 0 or 180
   */
  getRotation() {
    return this.rotation;
  }

  /**
   * 유닛의 목적지를 반환
   * @returns {{point: {x: float, z: float}, area: {x: float, z: float}[4][]}}
   */
  getDestination() {
    return { point: this.destinationPoint, area: this.destinationArea };
  }

  /**
   * 유닛이 목적지에 도달했는지 확인
   * @returns {boolean}
   */
  arrivedAtDestination() {
    const pos = this.getPosition();
    const { area } = this.getDestination();

    // 목적지 영역이 없을 시 목적지는 성채
    if (!area) {
      return false;
    }

    const arrived =
      pos.x >= area[0].x && // 서쪽 변 체크
      pos.z <= area[0].z && // 북쪽 변 체크
      pos.x <= area[2].x && // 동쪽 변 체크
      pos.z >= area[2].z; // 남쪽 변 체크

    return arrived;
  }

  /**
   * 유닛이 목적지에 도달했을 때 호출하여 다음 목적지를 설정
   * @returns {{point: {x: float, z: float}, area: {x: float, z: float}[4][]}}
   */
  updateDestination() {
    this.destinationPoint = this.path[++this.destinationIndex];

    // 목적지가 모퉁이일 경우에만 영역 지정
    if (this.destinationIndex < this.path.length - 1) {
      const corners = getMapCorners(this.species, this.direction);
      this.destinationArea = corners[this.destinationIndex - 1];

      if (LOG_ENABLED_UPDATE_DESTINATION)
        logger.info(
          `유닛 ${this.unitId}가 ${this.destinationIndex - 1}번째 모퉁이를 돌아 다음 목적지로 이동합니다.`,
        );
    } else {
      this.destinationArea = null;
    }
    return { point: this.destinationPoint, area: this.destinationArea };
  }

  getLastTimestamp() {
    return this.lastTimestamp;
  }

  /**
   * 유닛의 위치와 목적지를 업데이트
   * @param {{x: float, z: float}} position
   * @param {{y: float}} rotation
   * @param {int64} timestamp
   */
  move(position, rotation, timestamp) {
    this.position = position;
    this.rotation = rotation;
    this.lastTimestamp = timestamp;

    if (this.arrivedAtDestination()) {
      this.updateDestination();
    }
  }

  /**
   * 목표 유닛이 사거리 밖에 있는지 확인
   * @param {Unit} targetUnit 대상 유닛
   * @returns {{outOfRange: boolean, distance: float, attackRange: float}} 사거리 확인 결과
   */
  isTargetOutOfRange(targetPosition) {
    const distance = calcDist(this.getPosition(), targetPosition);
    const attackRange = this.getAttackRange() * RANGE_ERROR_MARGIN;
    return {
      outOfRange: distance > attackRange,
      distance,
      attackRange,
    };
  }
}

export default Unit;
