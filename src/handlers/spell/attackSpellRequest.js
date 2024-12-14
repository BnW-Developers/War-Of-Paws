import { SPELL_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/log/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import { LOG_ENABLED_SPELL_REQUEST, LOG_ENABLED_SPELL_PAYLOAD } from '../../utils/log/logSwitch.js';

/**
 * 공격 스펠 핸들러
 * @param {net.Socket} socket
 * @param { { center: { position: { x: float, z: float } }, unitIds: int32[] } } payload
 */
const attackSpellRequest = (socket, payload) => {
  try {
    const { center, unitIds } = payload;
    const timestamp = Date.now();

    // 검증: 세션 정보
    const { gameSession, user, userGameData, opponentGameData, opponentSocket } =
      checkSessionInfo(socket);

    // 로그 출력 및 저장
    const species = user.getCurrentSpecies();
    if (LOG_ENABLED_SPELL_REQUEST)
      logger.info(
        `${species} 플레이어가 공격 스펠 요청\n    대상 유닛: ${JSON.stringify(unitIds)}`,
      );

    if (LOG_ENABLED_SPELL_PAYLOAD)
      console.log(
        `공격 스펠 payload:\n` +
          `    center: ${JSON.stringify(center, null, 4)}` +
          `    unitIds: ${JSON.stringify(unitIds, null, 4)}`,
      );

    // 스펠 시전
    const { spellPacketData, unitDeathPacketData } = userGameData.castSpell(
      SPELL_TYPE.ATTACK,
      center.position,
      unitIds,
      timestamp,
      { gameSession, userGameData, opponentGameData },
    );

    // 자원 동기화 패킷 전송
    const mineralSyncPacket = { mineral: userGameData.getMineral() };
    sendPacket(socket, PACKET_TYPE.MINERAL_SYNC_NOTIFICATION, mineralSyncPacket);

    // 응답 패킷 전송
    sendPacket(socket, PACKET_TYPE.ATTACK_SPELL_RESPONSE, spellPacketData);
    // 상대방 알림 패킷 전송
    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_ATTACK_SPELL_NOTIFICATION, spellPacketData);

    // 사망 패킷 전송
    if (unitDeathPacketData.unitIds.length > 0) {
      sendPacket(socket, PACKET_TYPE.UNIT_DEATH_NOTIFICATION, unitDeathPacketData);
      sendPacket(opponentSocket, PACKET_TYPE.ENEMY_UNIT_DEATH_NOTIFICATION, unitDeathPacketData);
    }
  } catch (error) {
    handleErr(socket, error);
  }
};

export default attackSpellRequest;
