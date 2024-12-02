import {
  ATTACK_COOLDOWN_ERROR_MARGIN,
  ATTACK_RANGE_ERROR_MARGIN,
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
    return this.hp <= 0;
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
    return timestamp - this.lastAttackTime >= this.currentCooldown - ATTACK_COOLDOWN_ERROR_MARGIN;
  }

  resetLastAttackTime(timestamp) {
    this.lastAttackTime = timestamp;
  }

  resetLastSkillTime(timestamp) {
    this.lastSkillTime = timestamp;
  }

  isSkillAvailable(timestamp) {
    return timestamp - this.lastSkillTime >= this.skillCooldown - SKILL_COOLDOWN_ERROR_MARGIN;
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

    // 일정 시간 후 버프 해제
    setTimeout(() => {
      this.currentCooldown = this.cooldown; // 원래 쿨타임 복구
    }, duration);
  }

  // 체크포인트 유닛 위치 파악용 메서드
  getDirection() {
    return this.direction;
  }

  getPosition() {
    return this.position;
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
   * @param {{x: float, z: float}} pos
   * @param {int32} timestamp
   */
  move(pos, timestamp) {
    this.position = pos;
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
    const attackRange = this.getAttackRange() * ATTACK_RANGE_ERROR_MARGIN;
    logger.info(
      `Target ${targetUnit.getUnitId()} is out of range.` +
        `Distance: ${distance}, Range: ${attackRange}`,
    );
    return distance > attackRange;
  }
}

export default Unit;
