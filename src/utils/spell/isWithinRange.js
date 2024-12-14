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
  const distance = calcDist(centerPos, unitPos);
  return distance <= range * RANGE_ERROR_MARGIN;
};

export default isWithinRange;
