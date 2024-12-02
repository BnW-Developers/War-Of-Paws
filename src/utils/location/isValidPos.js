import isOutOfBounds from './isOutOfBounds.js';
import isTooFast from './isTooFast.js';

/**
 * 클라이언트가 보낸 유닛의 위치값이 정상인지 여부를 판단
 * @param {Unit} unit 유닛
 * @param {{x: float, z: float}} pos 움직이려는 위치
 * @param {int64} timestamp 도착시간
 * @return boolean
 */
const isValidPos = (unit, pos, timestamp) => {
  // 검증: 좌표의 형식이 올바른가?
  if (!pos || pos.x === null || pos.z === null) {
    throw new Error('잘못된 좌표입니다: pos', pos);
  }

  // 맵 경계를 벗어났는지 확인
  if (isOutOfBounds(unit, pos)) {
    return false;
  }

  // 해당 유닛의 이동속도보다 빠르게 움직였는지 확인
  if (isTooFast(unit, pos, timestamp)) {
    return false;
  }

  // 정상적인 위치임
  return true;
};

export default isValidPos;
