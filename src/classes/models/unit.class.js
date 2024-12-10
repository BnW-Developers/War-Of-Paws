import {
  ATTACK_COOLDOWN_ERROR_MARGIN,
  RANGE_ERROR_MARGIN,
  INITIAL_UNIT_ROTATION,
  SKILL_COOLDOWN_ERROR_MARGIN,
} from '../../constants/game.constants.js';
import { getMapCorners, getPath } from '../../utils/assets/getAssets.js';
import calcDist from '../../utils/location/calcDist.js';
import logger from '../../utils/logger.js';

class Unit {
  constructor(unitId, unitData, direction, spawnTime) {
    // ID 및 종족 관련
    this.unitId = unitId;
    this.species = unitData.species;
    this.type = unitData.type;

    // 능력치 관련
    this.maxHp = unitData.maxHp;
    this.hp = unitData.maxHp;
    this.attackPower = unitData.atk;
    this.attackRange = unitData.atkRange;
    this.def = unitData.def;
    this.speed = unitData.spd;
    this.buffFlag = false;
    this.deadFlag = false;

    // 쿨타임 관련
    this.cooldown = unitData.cd;
    this.currentCooldown = unitData.cd;
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

  getUnitId() {
    return this.unitId;
  }

  getSpecies() {
    return this.species;
  }

  getType() {
    return this.type;
  }

  getHp() {
    return this.hp;
  }

  // 사망 여부 확인 메서드
  isDead() {
    return this.deadFlag;
  }

  markAsDead() {
    this.deadFlag = true;
  }

  isBuffed() {
    if (this.buffFlag) {
      logger.info(`Target ${this.unitId} is already buffed`);
      return true;
    }
    return false;
  }

  getSpeed() {
    return this.speed;
  }

  getAttackPower() {
    return this.attackPower;
  }

  getAttackRange() {
    return this.attackRange;
  }

  isAttackAvailable(timestamp) {
    const elapsed = timestamp - this.lastAttackTime; // 경과 시간 계산
    const requiredTime = this.currentCooldown - ATTACK_COOLDOWN_ERROR_MARGIN; // 쿨타임 기준 계산

    // 쿨타임이 안된다면 로그 출력 & false 반환
    if (elapsed < requiredTime) {
      logger.info(
        `Attack not available: Unit ID ${this.unitId}, ` +
          `Current Cooldown: ${this.currentCooldown}, ` +
          `Remaining time: ${requiredTime - elapsed}`,
      );
      return false;
    }

    return true;
  }

  resetLastAttackTime(timestamp) {
    this.lastAttackTime = timestamp;
  }

  resetLastSkillTime(timestamp) {
    this.lastSkillTime = timestamp;
  }

  isSkillAvailable(timestamp) {
    const elapsed = timestamp - this.lastSkillTime; // 경과 시간 계산
    const requiredTime = this.skillCooldown - SKILL_COOLDOWN_ERROR_MARGIN; // 스킬 쿨다운 기준 계산

    if (elapsed < requiredTime) {
      logger.info(
        `Skill not available: Unit ID ${this.unitId}, ` +
          `Skill Cooldown: ${this.skillCooldown}, ` +
          `Remaining time: ${requiredTime - elapsed}`,
      );
      return false;
    }

    return true;
  }

  // 체력 감소 메서드
  applyDamage(damage) {
    this.hp = Math.max(0, this.hp - damage); // 체력은 0 이하로 감소하지 않음
    return this.hp;
  }

  applyHeal(healAmount) {
    // 최대 체력을 초과하지 않도록 체력을 회복
    this.hp = Math.min(this.hp + healAmount, this.maxHp);

    // 현재 체력을 반환
    return this.hp;
  }

  applyBuff(buffAmount, duration) {
    this.currentCooldown /= buffAmount; // 쿨타임 감소
    this.buffFlag = true;
    // 일정 시간 후 버프 해제
    setTimeout(() => {
      this.currentCooldown = this.cooldown; // 원래 쿨타임 복구
      this.buffFlag = false;
    }, duration);
  }

  // 체크포인트 유닛 위치 파악용 메서드
  getDirection() {
    return this.direction;
  }

  getPosition() {
    return this.position;
  }

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
   * 유닛이 목적지에 도착했는지 확인 후 결과를 반환
   * @returns boolean
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
   * @returns {boolean} 사거리 밖 여부
   */
  isTargetOutOfRange(targetUnit) {
    const distance = calcDist(this.getPosition(), targetUnit.getPosition());
    const attackRange = this.getAttackRange() * RANGE_ERROR_MARGIN;
    console.log('distance between units:', distance);
    console.log('attackUnit attack range(error margin version)', attackRange);
    return distance > attackRange;
  }
}

export default Unit;
