import { DIRECTION } from '../../constants/assets.js';
import { getMapBounds } from '../assets/getAssets.js';
import CustomErr from '../error/customErr.js';
import { ERR_CODES } from '../error/errCodes.js';

/**
 * 유닛이 잘못된 (반대편) 공격로에 있는지 확인하고 결과를 반환
 *
 * 반대편에 (잘못된 위치에) 있으면 true, 아니면 (정상적인 위치) false
 * @param {Unit} unit 유닛
 * @param {{x: float, z: float}} pos 위치
 * @returns {boolean}
 */
const isOnWrongSide = (unit, pos) => {
  const { centerLine } = getMapBounds();
  const dir = unit.getDirection();

  switch (dir) {
    case DIRECTION.UP:
      return pos.z < centerLine.z;
    case DIRECTION.DOWN:
      return pos.z > centerLine.z;
    default:
      throw new CustomErr(ERR_CODES.WRONG_SIDE, `잘못된 DIRECTION입니다: ${dir}`);
  }
};

export default isOnWrongSide;
