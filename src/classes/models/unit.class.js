class Unit {
  static idCounter = 1;

  constructor(unitData, toTop) {
    this.assetId = unitData.id;
    this.maxHp = unitData.maxHp;
    this.hp = unitData.maxHp;
    this.attackPower = unitData.atk;
    this.def = unitData.def;
    this.speed = unitData.spd;
    this.cooldown = unitData.cd;
    this.cost = unitData.cost;
    this.skillCooldown = unitData.skillCd;
    this.lastSkillUsedTime = 0;

    // toTop에 의한 초기 위치 설정
    this.position = toTop ? { x: 0, y: 0, z: 10 } : { x: 0, y: 0, z: -10 };

    this.unitId = Unit.idCounter++;
  }

  getUnitId() {
    return this.unitId;
  }

  getHp() {
    return this.hp;
  }

  getAssetId() {
    return this.assetId;
  }

  getAttackPower() {
    return this.attackPower;
  }

  getPosition() {
    return this.position;
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

  resetLastSkillUsedTime() {
    this.lastSkillUsedTime = Date.now();
  }

  isSkillAvailable() {
    const currentTime = Date.now();
    return currentTime - this.lastSkillUsedTime >= this.skillCooldown;
  }

  applyBuff(buffAmount, duration) {
    // bufFAmount가 2라면 (2배) 쿨타임은 나누기
    this.cooldown /= buffAmount;

    // 일정 시간 후 원래 공격속도 복구
    setTimeout(() => {
      this.cooldown *= buffAmount;
    }, duration);
  }
}

export default Unit;
