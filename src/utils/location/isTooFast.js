import { SPEED_MARGIN_OF_ERROR } from '../../constants/game.constants.js';
import calcSpd from './calcSpd.js';
import chalk from 'chalk';
import round from '../math/round.js';

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

  if (actualSpeed > maxSpeed * SPEED_MARGIN_OF_ERROR) {
    console.log(
      chalk.greenBright(
        `유닛이 너무 빠릅니다!  유닛속도: ${round(maxSpeed * SPEED_MARGIN_OF_ERROR, 2)} 실제속도: ${round(actualSpeed, 2)}`,
      ),
    );

    return true;
  } else {
    return false;
  }
};

export default isTooFast;
