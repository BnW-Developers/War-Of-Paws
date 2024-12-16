import Unit from '../../classes/models/unit.class.js'; // eslint-disable-line
import { SPELL_TYPE } from '../../constants/assets.js';
import { RANGE_ERROR_MARGIN } from '../../constants/game.constants.js';
import calcDist from '../location/calcDist.js';
import logger from '../log/logger.js';
import { LOG_ENABLED_SPELL_OUT_OF_RANGE } from '../log/logSwitch.js';

const spellName = new Map([
  [SPELL_TYPE.ATTACK, '공격'],
  [SPELL_TYPE.HEAL, '힐'],
  [SPELL_TYPE.BUFF, '버프'],
  [SPELL_TYPE.STUN, '스턴'],
]);

/**
 * 타겟 유닛이 사정거리 내에 있는지 확인
 * @param {Unit} unit
 * @param {{ x: number, z: number }} centerPos
 * @param {{ type: SPELL_TYPE, damage?: number, healAmount?: number, buffAmount?: number, duration?: number }} spell
 * @returns
 */
const isWithinRange = (unit, centerPos, spell) => {
  const distance = calcDist(centerPos, unit.getPosition());
  const range = spell.range;

  const withinRange = distance <= range * RANGE_ERROR_MARGIN;

  if (!withinRange) {
    if (LOG_ENABLED_SPELL_OUT_OF_RANGE)
      logger.info(
        `유닛 ${unit.getUnitId()}에 대한 ${spellName[spell.type]} 스펠 실패: 사정거리 초과`,
      );
  }

  return withinRange;
};

export default isWithinRange;
