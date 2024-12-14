import { SPELL_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/log/logger.js';
import { LOG_ENABLED_SPELL_PAYLOAD, LOG_ENABLED_SPELL_REQUEST } from '../../utils/log/logSwitch.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import isWithinRange from '../../utils/spell/isWithinRange.js';

/**
 * 힐 스펠 핸들러
 * @param {net.Socket} socket
 * @param { { center: { position: { x: float, z: float } }, unitIds: int32[] } } payload
 */
const healSpellRequest = (socket, payload) => {
  try {
    const { center, unitIds } = payload;
    const timestamp = Date.now();

    // 검증: 세션 정보
    const { user, userGameData, opponentSocket } = checkSessionInfo(socket);

    // 로그 출력 및 저장
    const species = user.getCurrentSpecies();
    if (LOG_ENABLED_SPELL_REQUEST)
      logger.info(`${species} 플레이어가 힐 스펠 요청\n    대상 유닛: ${JSON.stringify(unitIds)}`);

    if (LOG_ENABLED_SPELL_PAYLOAD)
      console.log(
        `힐 스펠 payload:\n` +
          `    center: ${JSON.stringify(center, null, 4)}` +
          `    unitIds: ${JSON.stringify(unitIds, null, 4)}`,
      );

    // 전송할 패킷 데이터
    const packetData = { unitInfos: [] };

    // 스펠 데이터 조회
    const { healAmount, range } = userGameData.getSpellData(SPELL_TYPE.HEAL);

    // 검증: 스펠 쿨타임
    const spellAvailable = userGameData.isSpellAvailable(SPELL_TYPE.HEAL, timestamp);
    if (spellAvailable) {
      // 스펠 쿨타임 초기화
      userGameData.resetLastSpellTime(SPELL_TYPE.HEAL, timestamp);

      // 대상 유닛 처리
      for (const unitId of unitIds) {
        // 검증: 피아식별
        const targetUnit = userGameData.getUnit(unitId);
        if (!targetUnit) {
          throw new CustomErr(ERR_CODES.TREASON, '힐 대상이 적군이거나 유닛이 존재하지 않습니다.');
        }

        // 검증: 스펠 사정거리
        if (isWithinRange(targetUnit, center.position, range, SPELL_TYPE.HEAL)) {
          // 힐 적용
          const resultHp = targetUnit.applyHeal(healAmount);

          // 회복한 유닛 정보 패킷에 추가
          packetData.unitInfos.push({ unitId, unitHp: resultHp });
        }
      }

      // 자원 동기화 패킷 전송
      const mineralSyncPacket = { mineral: userGameData.getMineral() };
      sendPacket(socket, PACKET_TYPE.MINERAL_SYNC_NOTIFICATION, mineralSyncPacket);

      // 응답 패킷 전송
      sendPacket(socket, PACKET_TYPE.HEAL_SPELL_RESPONSE, packetData);

      // 상대방 알림 패킷 전송
      sendPacket(opponentSocket, PACKET_TYPE.ENEMY_HEAL_SPELL_NOTIFICATION, packetData);
    }
  } catch (error) {
    handleErr(socket, error);
  }
};

export default healSpellRequest;
