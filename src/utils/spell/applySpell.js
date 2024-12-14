import Game from '../../classes/models/game.class.js'; // eslint-disable-line
import PlayerGameData from '../../classes/models/playerGameData.class.js'; // eslint-disable-line
import Unit from '../../classes/models/unit.class.js'; // eslint-disable-line
import { SPELL_TYPE } from '../../constants/assets.js';
import processDeath from '../death/processDeath.js';

/**
 * 스펠의 효과를 타겟 유닛에게 적용 & 패킷 데이터 처리
 * @param {Unit} targetUnit
 * @param {SPELL_TYPE} spellType
 * @param {{ damage?: number, healAmount?: number, buffAmount?: number, duration?: number }} spellData
 * @param {{ spellPacketData: {}, unitDeathPacketData?: {} }} packetData
 * @param {{ gameSession: Game, opponentGameData: PlayerGameData }} sessionInfo
 */
const applySpell = (targetUnit, spellType, spellData, packetData, sessionInfo) => {
  // 세션 정보
  const { gameSession, opponentGameData } = sessionInfo;

  const unitId = targetUnit.getUnitId();

  switch (spellType) {
    case SPELL_TYPE.ATTACK: {
      // 데미지 적용
      const resultHp = targetUnit.applyDamage(spellData.damage);

      // 유닛 사망처리
      if (targetUnit.getHp() <= 0) {
        processDeath(targetUnit, gameSession, opponentGameData, packetData.unitDeathPacketData);
      }

      // 피격 유닛 정보 패킷에 추가
      packetData.spellPacketData.unitInfos.push({
        unitId,
        unitHp: resultHp,
      });

      break;
    }

    case SPELL_TYPE.HEAL: {
      // 힐 적용
      const resultHp = targetUnit.applyHeal(spellData.healAmount);

      // 회복한 유닛 정보 패킷에 추가
      packetData.spellPacketData.unitInfos.push({
        unitId,
        unitHp: resultHp,
      });

      break;
    }

    case SPELL_TYPE.BUFF: {
      // 버프 적용
      targetUnit.applyBuff(spellData.buffAmount, spellData.duration);

      // 버프받은 유닛 정보 패킷에 추가
      packetData.spellPacketData.unitIds.push(unitId);

      break;
    }

    case SPELL_TYPE.STUN: {
      // 버프 적용
      targetUnit.applyStun(spellData.duration);

      // 스턴당한 유닛 정보 패킷에 추가
      packetData.spellPacketData.unitIds.push(unitId);

      break;
    }

    default: {
      throw new Error(`잘못된 스펠 타입입니다: ${spellType}`);
    }
  }
};

export default applySpell;
