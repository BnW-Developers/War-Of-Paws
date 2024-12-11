import { getMapBounds } from '../assets/getAssets.js';
import chalk from 'chalk';
import formatCoords from '../formatter/formatCoords.js';
import { LOG_ENABLED_OUT_OF_BOUNDS } from '../log/logSwitch.js';

/**
 * 지정한 위치가 맵에서 벗어난 위치인지 확인하고 결과를 반환
 *
 * 맵 경계를 벗어났으면 (비정상적인 위치) true, 아니면 (정상적인 위치) false
 *
 * 직사각형 모양의 도넛형 맵을 상정한 로직으로, 맵 구조가 복잡해진다면 변경이 필요함
 * @param {{x: float, z: float}} pos 위치
 * @returns {boolean}
 */
const isOutOfBounds = (pos) => {
  const { outerBound, innerBound } = getMapBounds();

  // 바깥쪽 경계를 벗어났는지 검증
  if (
    pos.x < outerBound[0].x || // 서쪽으로 벗어남
    pos.z > outerBound[0].z || // 북쪽으로 벗어남
    pos.x > outerBound[2].x || // 동쪽으로 벗어남
    pos.z < outerBound[2].z // 남쪽으로 벗어남
  ) {
    if (LOG_ENABLED_OUT_OF_BOUNDS)
      console.log(chalk.magentaBright('바깥쪽 경계 이탈:', formatCoords(pos, 2)));

    return true;
  }

  // 안쪽 경계를 벗어났는지 검증
  if (
    pos.x > innerBound[0].x && // 서쪽으로 벗어남
    pos.z < innerBound[0].z && // 북쪽으로 벗어남
    pos.x < innerBound[2].x && // 동쪽으로 벗어남
    pos.z > innerBound[2].z // 남쪽으로 벗어남
  ) {
    if (LOG_ENABLED_OUT_OF_BOUNDS)
      console.log(chalk.blueBright('안쪽 경계 이탈:', formatCoords(pos, 2)));

    return true;
  }
  return false;
};

export default isOutOfBounds;
