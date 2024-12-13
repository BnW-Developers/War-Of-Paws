import { SPELL_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/log/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import isWithinRange from '../../utils/spell/isWithinRange.js';
import {
  LOG_ENABLED_SPELL_REQUEST,
  LOG_ENABLED_SPELL_OUT_OF_RANGE,
  LOG_ENABLED_SPELL_PAYLOAD,
} from '../../utils/log/logSwitch';
import processDeath from '../../utils/death/processDeath.js';

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

    // 전송할 패킷 데이터
    const attackSpellPacketData = { unitInfos: [] };
    const unitDeathPacketData = { unitIds: [] };

    // 스펠 데이터 조회
    const { damage, range } = userGameData.getSpellData(SPELL_TYPE.ATTACK);

    // 검증: 스펠 쿨타임
    const spellAvailable = userGameData.isSpellAvailable(SPELL_TYPE.ATTACK, timestamp);
    if (spellAvailable) {
      // 스펠 쿨타임 초기화
      userGameData.resetLastSpellTime(SPELL_TYPE.ATTACK, timestamp);

      // 대상 유닛 처리
      for (const unitId of unitIds) {
        // 검증: 피아식별
        const targetUnit = opponentGameData.getUnit(unitId);
        if (!targetUnit) {
          throw new CustomErr(
            ERR_CODES.FRIENDLY_FIRE,
            '공격 대상이 아군이거나 유닛이 존재하지 않습니다.',
          );
        }

        // 검증: 스펠 사정거리
        if (!isWithinRange(center.position, targetUnit.getPosition(), range)) {
          if (LOG_ENABLED_SPELL_OUT_OF_RANGE)
            logger.info(`유닛 ${unitId}에 대한 공격 스펠 실패: 사정거리 초과`);
          continue;
        }

        // 데미지 적용
        const resultHp = targetUnit.applyDamage(damage);

        // 유닛 사망처리
        if (targetUnit.getHp() <= 0) {
          processDeath(targetUnit, gameSession, opponentGameData, unitDeathPacketData);
        }

        // 피격 유닛 정보 패킷에 추가
        attackSpellPacketData.unitInfos.push({ unitId, unitHp: resultHp });
      }
    }

    // 응답 패킷 전송
    sendPacket(socket, PACKET_TYPE.ATTACK_SPELL_RESPONSE, attackSpellPacketData);
    // 상대방 알림 패킷 전송
    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_ATTACK_SPELL_NOTIFICATION, attackSpellPacketData);

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
