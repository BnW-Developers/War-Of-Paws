import Unit from '../../classes/models/unit.class.js'; // eslint-disable-line
import logger from '../log/logger.js';

/**
 * 공통 로그 출력 함수
 * @param {string} situation 상황 설명
 * @param {string} message 로그 메시지
 * @param {Object} details 추가 정보
 */
const logValidationError = (situation, message, details = {}) => {
  logger.warn(`Validation failed in ${situation}: ${message}`);
  if (Object.keys(details).length > 0) {
    logger.warn(`Details: ${JSON.stringify(details)}`);
  }
};

/**
 * 유닛 간 검증
 * @param {Unit} sourceUnit
 * @param {Unit} targetUnit
 * @param {string} situation
 * @returns {boolean}
 */
const validateTarget = (sourceUnit, targetUnit, situation) => {
  // 시전 유닛이 존재하지 않는 경우
  if (!sourceUnit) {
    logValidationError(situation, 'Source unit not found.');
    return false;
  }
  const sourceUnitId = sourceUnit.getUnitId();

  // 대상 유닛이 존재하지 않는 경우
  if (!targetUnit) {
    logValidationError(situation, 'Target unit not found.', { sourceUnitId });
    return false;
  }
  const targetUnitId = targetUnit.getUnitId();

  // 아군인 경우
  if (sourceUnit.getSpecies() === targetUnit.getSpecies()) {
    logValidationError(situation, "Can't attack ally units.", {
      sourceUnitId,
      targetUnitId,
    });
    return false;
  }

  // 너무 먼 사거리 공격 방지
  const rangeCheck = sourceUnit.isTargetOutOfRange(targetUnit.getPosition());
  if (rangeCheck.outOfRange) {
    logValidationError(situation, 'Target is out of range.', {
      sourceUnitId,
      targetUnitId,
      attackRange: rangeCheck.attackRange,
      distance: rangeCheck.distance,
    });
    return false;
  }

  /// 같은 라인이여야 공격 가능
  if (sourceUnit.direction !== targetUnit.direction) {
    logValidationError(situation, 'Target is not on the same line.', {
      sourceUnitId,
      targetUnitId,
    });
    return false;
  }

  return true; // 모든 검증을 통과
};

export default validateTarget;
