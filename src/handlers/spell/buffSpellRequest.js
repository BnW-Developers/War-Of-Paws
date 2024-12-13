import { SPELL_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/log/logger.js';
import {
  LOG_ENABLED_SPELL_OUT_OF_RANGE,
  LOG_ENABLED_SPELL_PAYLOAD,
  LOG_ENABLED_SPELL_REQUEST,
} from '../../utils/log/logSwitch.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import isWithinRange from '../../utils/spell/isWithinRange.js';

/**
 * 버프 스펠 핸들러
 * @param {net.Socket} socket
 * @param { { center: { position: { x: float, z: float } }, unitIds: int32[] } } payload
 */
const buffSpellRequest = (socket, payload) => {
  try {
    const { center, unitIds } = payload;
    const timestamp = Date.now();

    // 검증: 세션 정보
    const { user, userGameData, opponentSocket } = checkSessionInfo(socket);

    // 로그 출력 및 저장
    const species = user.getCurrentSpecies();
    if (LOG_ENABLED_SPELL_REQUEST)
      logger.info(
        `${species} 플레이어가 버프 스펠 요청\n    대상 유닛: ${JSON.stringify(unitIds)}`,
      );

    if (LOG_ENABLED_SPELL_PAYLOAD)
      console.log(
        `버프 스펠 payload:\n` +
          `    center: ${JSON.stringify(center, null, 4)}` +
          `    unitIds: ${JSON.stringify(unitIds, null, 4)}`,
      );

    // 스펠 데이터 조회
    const {
      range,
      buffAmount,
      duration: buffDuration,
    } = userGameData.getSpellData(SPELL_TYPE.BUFF);

    // 전송할 패킷 데이터
    const packetData = { unitIds: [], buffAmount, buffDuration };

    // 검증: 스펠 쿨타임
    const spellAvailable = userGameData.isSpellAvailable(SPELL_TYPE.BUFF, timestamp);
    if (spellAvailable) {
      // 스펠 쿨타임 초기화
      userGameData.resetLastSpellTime(SPELL_TYPE.BUFF, timestamp);

      // 대상 유닛 처리
      for (const unitId of unitIds) {
        // 검증: 피아식별
        const targetUnit = userGameData.getUnit(unitId);
        if (!targetUnit) {
          throw new CustomErr(
            ERR_CODES.TREASON,
            '버프 대상이 적군이거나 유닛이 존재하지 않습니다.',
          );
        }

        // 검증: 스펠 사정거리
        if (!isWithinRange(center.position, targetUnit.getPosition(), range)) {
          if (LOG_ENABLED_SPELL_OUT_OF_RANGE)
            logger.info(`유닛 ${unitId}에 대한 버프 스펠 실패: 사정거리 초과`);
          continue;
        }

        // 버프 적용
        targetUnit.applyBuff(buffAmount);

        // 버프받은 유닛 정보 패킷에 추가
        packetData.unitIds.push(unitId);
      }

      // 응답 패킷 전송
      sendPacket(socket, PACKET_TYPE.BUFF_SPELL_RESPONSE, packetData);

      // 상대방 알림 패킷 전송
      sendPacket(opponentSocket, PACKET_TYPE.ENEMY_BUFF_SPELL_NOTIFICATION, packetData);
    }
  } catch (error) {
    handleErr(socket, error);
  }
};

export default buffSpellRequest;
