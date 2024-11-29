import calcSpd from './calcSpd.js';

/**
 * 유닛이 자신의 속도보다 빠르게 움직였는지 여부를 반환
 * @param {Unit} unit 유닛
 * @param {{x: float, z: float}} pos 도착한 위치
 * @param {int32} endTime 도착한 시간
 * @returns
 */
const isTooFast = (unit, endPos, endTime) => {
  const startTime = unit.getLastTimestamp();
  const timeTaken = endTime - startTime; // ms

  const startPos = unit.getPosition();
  const actualSpeed = calcSpd(startPos, endPos, timeTaken);
  const maxSpeed = unit.getSpeed();

  return actualSpeed > maxSpeed;
};

export default isTooFast;
