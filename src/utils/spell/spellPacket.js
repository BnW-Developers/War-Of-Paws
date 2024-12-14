import { SPELL_TYPE } from '../../constants/assets.js';

/**
 * 스펠 패킷데이터 초기화
 *
 * 호출 예시:
 * - `const packetData = initializeSpellPacketData(spellType);`
 * - `const { spellPacketData, unitDeathPacketData } = packetData;`
 * @param {SPELL_TYPE} spellType
 * @returns {{spellPacketData: {}, unitDeathPacketData?: {}}}
 */
const initializeSpellPacketData = (spellType) => {
  switch (spellType) {
    case SPELL_TYPE.ATTACK: {
      const spellPacketData = { unitInfos: [] };
      const unitDeathPacketData = { unitIds: [] };
      return { spellPacketData, unitDeathPacketData };
    }
    case SPELL_TYPE.HEAL: {
      const spellPacketData = { unitInfos: [] };
      return { spellPacketData };
    }
    case SPELL_TYPE.BUFF: {
      const spellPacketData = { unitIds: [], buffAmount: 0, buffDuration: 0 };
      return { spellPacketData };
    }
    case SPELL_TYPE.STUN: {
      const spellPacketData = { unitIds: [], stunDuration: 0 };
      return { spellPacketData };
    }
    default:
      throw new Error(`잘못된 스펠 타입입니다: ${spellType}`);
  }
};

export default initializeSpellPacketData;
