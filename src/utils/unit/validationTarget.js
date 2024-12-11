import logger from '../log/logger.js';

const validateTarget = (sourceUnit, targetUnit) => {
  // 시전 유닛이 존재하지 않는 경우
  if (!sourceUnit) {
    logger.warn(`Source unit with ID ${sourceUnit.getUnitId()} not found`);
    return false;
  }

  // 아군인 경우
  if (sourceUnit.getSpecies() === targetUnit.getSpecies()) {
    logger.warn(`Can't attack our team. ${sourceUnit.getUnitId()} to ${targetUnit.getUnitId()}`);
    return false;
  }

  // 대상 유닛이 존재하지 않는 경우
  if (!targetUnit) {
    logger.warn(`Target unit with ID ${targetUnit.getUnitId()} not found`);
    return false;
  }

  // 너무 먼 사거리 공격 방지
  if (sourceUnit.isTargetOutOfRange(targetUnit)) {
    logger.warn(`Target ${targetUnit.getUnitId()} is out of range to ${targetUnit.getUnitId()}`);
    return false;
  }

  // 같은 라인이여야 공격 가능
  if (sourceUnit.direction !== targetUnit.direction) {
    logger.warn(`Target ${targetUnit.getUnitId()} is not your line`);
    return false;
  }

  return true; // 모든 검증을 통과
};

export default validateTarget;
