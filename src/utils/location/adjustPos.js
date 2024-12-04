import calcDist from './calcDist.js';
import formatCoords from '../formatter/formatCoords.js';
import round from '../math/round.js';
import formatTime from '../formatter/timeFormatter.js';

/**
 * 서버가 예측하는 유닛의 현재 위치값을 반환
 * @param {Unit} unit 유닛
 * @param {int64} timestamp 현재 위치동기화 시간
 * @return {{x: float, z: float}}
 */
const adjustPos = (unit, timestamp) => {
  const timeTaken = timestamp - unit.getLastTimestamp(); // ms
  const startPos = unit.getPosition();
  const endPos = unit.getDestination().point;

  const scalarDist = unit.getSpeed() * (timeTaken / 1000); // 주어진 시간동안 유닛이 이동할 수 있는 직선거리
  const totalScalarDist = calcDist(startPos, endPos); // 유닛의 현재 위치에서 목적지까지의 거리
  const progressRate = scalarDist / totalScalarDist; // 유닛이 목적지까지 나아간 거리의 비율

  const x = startPos.x + (endPos.x - startPos.x) * progressRate;
  const z = startPos.z + (endPos.z - startPos.z) * progressRate;

  console.log(`timestamp: ${formatTime(timestamp, false)}`);
  console.log(`unit.getLastTimestamp(): ${formatTime(unit.getLastTimestamp(), false)}`);
  console.log(`timeTaken: ${timeTaken}`);
  console.log(`startPos: ${formatCoords(startPos, 2)}`);
  console.log(`endPos: ${formatCoords(endPos, 2)}`);
  console.log(`scalarDist: ${round(scalarDist, 2)}`);
  console.log(`totalScalarDist: ${round(totalScalarDist, 2)}`);
  console.log(`progressRate: ${round(progressRate * 100, 2)}%`);

  return { x, z };
};

export default adjustPos;
