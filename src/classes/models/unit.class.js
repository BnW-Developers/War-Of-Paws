import { getPath } from '../../utils/assets/getAssets.js';

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
    this.startedMovingAt = spawnTime;
  }

  // 체크포인트 유닛 위치 파악용 메서드
  getDirection() {
    return this.direction;
  }

  getUnitId() {
    return this.unitId;
  }

  getSpecies() {
    return this.species;
  }

  getHp() {
    return this.hp;
  }

  getType() {
    return this.type;
  }

  getAttackPower() {
    return this.attackPower;
  }

  getPosition() {
    return this.position;
  }

  getDestination() {
    return this.path[this.destinationIndex];
  }

  isAttackAvailable(timestamp) {
    return timestamp - this.lastAttackTime >= this.currentCooldown; // 현재 쿨타임(버프 되었든 아니든)
  }

  resetLastAttackTime(timestamp) {
    this.lastAttackTime = timestamp;
  }

  // 체력 감소 메서드
  applyDamage(damage) {
    this.hp = Math.max(0, this.hp - damage); // 체력은 0 이하로 감소하지 않음
    return this.hp;
  }

  // 사망 여부 확인 메서드
  isDead() {
    return this.hp <= 0;
  }

  applyHeal(healAmount) {
    // 최대 체력을 초과하지 않도록 체력을 회복
    this.hp = Math.min(this.hp + healAmount, this.maxHp);

    // 현재 체력을 반환
    return this.hp;
  }

  resetLastSkillTime(timestamp) {
    this.lastSkillTime = timestamp;
  }

  isSkillAvailable(timestamp) {
    return timestamp - this.lastSkillTime >= this.skillCooldown;
  }

  applyBuff(buffAmount, duration) {
    this.currentCooldown /= buffAmount; // 쿨타임 감소

    // 일정 시간 후 버프 해제
    setTimeout(() => {
      this.currentCooldown = this.cooldown; // 원래 쿨타임 복구
    }, duration);
  }
}

export default Unit;
