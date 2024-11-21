class Unit {
  static idCounter = 1;

  constructor(assetId, toTop) {
    // TODO: 데이터테이블 추가시 assetId로 조회한 데이터로 프로퍼티 초기화
    this.assetId = assetId;
    this.instanceId = Unit.idCounter++;
    this.maxHp = 100;
    this.hp = 100;
    this.attackPower = 25;
    // TODO: 방향 (toTop)에 따른 초기위치 클라이언트에서 구현된 유닛 경로에 맞춰서 조정
    this.position = toTop ? { x: 0, y: 0, z: 10 } : { x: 0, y: 0, z: -10 };
  }

  getUnitId() {
    return this.instanceId;
  }

  getHp() {
    return this.hp;
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
}

export default Unit;
