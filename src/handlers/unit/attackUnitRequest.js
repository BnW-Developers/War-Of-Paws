import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';
import validateTarget from '../../utils/unit/validationTarget.js';

const attackUnitRequest = (socket, payload) => {
  try {
    const { unitId, timestamp, opponentUnitIds } = payload;

    logger.info(`attack unit request id: ${unitId} to ${opponentUnitIds} time: ${timestamp}`);
    const { userGameData, opponentGameData, opponentSocket, gameSession } =
      checkSessionInfo(socket);

    const attackUnit = userGameData.getUnit(unitId);
    if (!attackUnit) {
      throw new CustomErr(ERR_CODES.UNIT_NOT_FOUND, 'Unit not found');
    }

    // 결과 저장용 배열
    const opponentUnitInfos = [];
    const deathNotifications = [];

    // 공격 쿨타임 검증
    if (attackUnit.isAttackAvailable(timestamp)) {
      // 대상 유닛 처리
      for (const opponentUnitId of opponentUnitIds) {
        const targetUnit = opponentGameData.getUnit(opponentUnitId);

        // 유닛 존재, 라인, 사거리 검증
        if (!validateTarget(attackUnit, targetUnit)) continue;

        // 데미지 적용
        const resultHp = targetUnit.applyDamage(attackUnit.getAttackPower());
        attackUnit.resetLastAttackTime(timestamp); // 마지막 공격시간 초기화

        // Hp와 사망처리를 둘다 체크하는 이유는 동시성 제어 때문.
        // 두개의 패킷이 동시에 들어와 최후의 일격을 가한다면 이미 remove된 유닛을 다시 remove할 가능성이 있음
        if (targetUnit.getHp() <= 0) {
          processingDeath(
            targetUnit,
            opponentGameData,
            opponentUnitId,
            gameSession,
            deathNotifications,
          );
        }

        // 공격당한 유닛 정보 추가
        opponentUnitInfos.push({
          unitId: opponentUnitId,
          unitHp: resultHp, // HP는 음수가 될 수 없도록 처리
        });
      }
    }

    // 공격 알림
    sendPacket(socket, PACKET_TYPE.ATTACK_UNIT_RESPONSE, {
      unitInfos: opponentUnitInfos,
    });

    sendPacket(opponentSocket, PACKET_TYPE.ENEMY_UNIT_ATTACK_NOTIFICATION, {
      unitInfos: opponentUnitInfos,
    });

    // 양 클라이언트에 사망 패킷 전송
    sendDeathNotifications(socket, opponentSocket, deathNotifications);
  } catch (err) {
    handleErr(socket, err);
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

export default attackUnitRequest;
