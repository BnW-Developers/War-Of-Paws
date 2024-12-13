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
} from '../../utils/log/logSwitch';

/**
 * 공격 스펠 핸들러
 * @param {net.Socket} socket
 * @param { { center: { position: { x: float, z: float } }, timestamp: int64, unitIds: int32[] } } payload
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

    // 전송할 패킷 데이터
    const opponentUnitInfos = [];
    const deathNotifications = [];

    // 스펠 데이터 조회
    const { damage, range } = userGameData.getSpellData(SPELL_TYPE.ATTACK);

    // 검증: 스펠 쿨타임
    const spellAvailable = userGameData.isSpellAvailable(SPELL_TYPE.ATTACK, timestamp);
    if (spellAvailable) {
      // 스펠 쿨타임 초기화
      userGameData.resetLastSpellTime(timestamp);

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
          processingDeath(targetUnit, opponentGameData, unitId, gameSession, deathNotifications);
        }

        // 공격당한 유닛 정보 추가
        opponentUnitInfos.push({
          unitId,
          unitHp: resultHp, // HP는 음수가 될 수 없도록 처리
        });
      }
    }

    // 응답 패킷 전송
    sendPacket(socket, PACKET_TYPE.ATTACK_SPELL_RESPONSE, {
      unitInfos: opponentUnitInfos,
    });

    // 상대방 알림 패킷 전송
    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_ATTACK_SPELL_NOTIFICATION, {
      unitInfos: opponentUnitInfos,
    });

    // 사망 패킷 전송
    sendDeathNotifications(socket, opponentSocket, deathNotifications);
  } catch (error) {
    handleErr(socket, error);
  }
};

const processingDeath = (unit, gameData, unitId, session, notifications) => {
  if (unit.isDead()) {
    logger.info(`Unit ${unitId} is already dead.`);
    return false;
  }

  unit.markAsDead(); // 플래그 설정
  const checkPointManager = session.getCheckPointManager();
  if (checkPointManager.isExistUnit(unitId)) {
    checkPointManager.removeUnit(unitId);
  }

  gameData.removeUnit(unitId); // 데이터 삭제
  notifications.push(unitId); // 사망 알림
  logger.info(`Unit ${unitId} death processing is done.`);
  return true;
};

const sendDeathNotifications = (socket, opponentSocket, notifications) => {
  if (notifications.length > 0) {
    sendPacket(socket, PACKET_TYPE.UNIT_DEATH_NOTIFICATION, { unitIds: notifications });
    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_UNIT_DEATH_NOTIFICATION, {
      unitIds: notifications,
    });
  }
};

export default attackSpellRequest;
