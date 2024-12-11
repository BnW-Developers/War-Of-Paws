import { RANGE_ERROR_MARGIN } from '../../constants/game.constants.js';
import calcDist from '../location/calcDist.js';

/**
 * 타겟 유닛이 사정거리 내에 있는지 확인
 * @param {{ x: number, z: number }} centerPos
 * @param {{ x: number, z: number }} unitPos
 * @param {number} range
 * @returns
 */
const isWithinRange = (centerPos, unitPos, range) => {
  // 파라미터 유효성 검증
  if (!centerPos || centerPos.x === null || centerPos.z === null) {
    throw new Error('잘못된 좌표입니다: centerPos', centerPos);
  }
  if (!unitPos || unitPos.x === null || unitPos.z === null) {
    throw new Error('잘못된 좌표입니다: unitPos', unitPos);
  }
  if (range === null) {
    throw new Error('잘못된 사정거리입니다: range', range);
  }

  const distance = calcDist(centerPos, unitPos);

  return distance <= range * RANGE_ERROR_MARGIN;
};

export default isWithinRange;
