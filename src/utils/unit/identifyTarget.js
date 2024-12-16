import PlayerGameData from '../../classes/models/playerGameData.class.js'; // eslint-disable-line
import CustomErr from '../error/customErr.js';
import { ERR_CODES } from '../error/errCodes.js';

/**
 * 행동 (공격, 스펠 등)의 대상이 되는 유닛의 피아식별을 진행
 *
 * 호출 예시:
 * - `const sessionInfo = { userGameData, opponentGameData }`
 * - `const targetUnit = identifyTarget(unitId, isOffensive, sessionInfo);`
 * @param {number} unitId
 * @param {boolean} isOffensive
 * @param {{userGameData: PlayerGameData, opponentGameData: PlayerGameData}} sessionInfo
 * @returns
 */
const identifyTarget = (unitId, isOffensive, sessionInfo) => {
  // 세션 정보
  const { userGameData, opponentGameData } = sessionInfo;

  const targetUnit = isOffensive ? opponentGameData.getUnit(unitId) : userGameData.getUnit(unitId);
  if (!targetUnit) {
    if (isOffensive) {
      throw new CustomErr(
        ERR_CODES.FRIENDLY_FIRE,
        '공격 대상이 아군이거나 유닛이 존재하지 않습니다.',
      );
    } else {
      throw new CustomErr(ERR_CODES.TREASON, '버프 대상이 적군이거나 유닛이 존재하지 않습니다.');
    }
  }

  return targetUnit;
};

export default identifyTarget;
