import gameSessionManager from '../../classes/managers/gameSessionManager.js';
import sendPacket from '../../classes/models/sendPacket.class.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { createResponse } from '../../utils/response/createResponse.js';

const attackUnitRequest = (socket, payload) => {
  try {
    const { unitId, opponentUnitIds } = payload; // 여러 대상 유닛 처리

    const { playerGameData, opponentPlayerGameData } =
      gameSessionManager.getAllPlayerGameDataBySocket(socket);

    if (!playerGameData || !opponentPlayerGameData)
      throw new CustomErr(ERR_CODES.PLAYER_GAME_DATA_NOT_FOUND, 'Player game data not found');

    // 공격 유닛 가져오기
    const attackUnit = playerGameData.getUnit(unitId);

    // 결과 저장용 배열
    const opponentUnitInfos = [];
    const deathNotifications = [];

    // 대상 유닛 처리
    for (const opponentUnitId of opponentUnitIds) {
      const targetUnit = opponentPlayerGameData.getUnit(opponentUnitId);

      // 데미지 적용
      const resultHp = targetUnit.applyDamage(attackUnit.getAttackPower());

      if (targetUnit.isDead()) {
        opponentPlayerGameData.removeUnit(opponentUnitId); // 유닛 제거
        deathNotifications.push(opponentUnitId); // 사망 알림 추가
      }

      // 공격당한 유닛 정보 추가
      opponentUnitInfos.push({
        opponentUnitId,
        opponentUnitHp: resultHp, // HP는 음수가 될 수 없도록 처리
      });
    }

    // 공격 알림
    // TODO: 근데 이거 RESPONSE 왜 돌려주는 거였지..? 건망증 GOAT..
    const attackResponsePacket = createResponse(PACKET_TYPE.ATTACK_UNIT_RESPONSE, {
      opponentUnitInfos,
    });
    sendPacket.enQueue(socket, attackResponsePacket);

    // 상대방 공격 Notification
    const opponentSocket = opponentPlayerGameData.getSocket();
    if (!opponentSocket) {
      throw new CustomErr(ERR_CODES.OPPONENT_SOCKET_NOT_FOUND, 'Opponent socket not found');
    }
    const opponentNotificationPacket = createResponse(PACKET_TYPE.ENEMY_UNIT_ATTACK_NOTIFICATION, {
      unitInfos: opponentUnitInfos,
    });
    sendPacket.enQueue(opponentSocket, opponentNotificationPacket);

    // 사망한 유닛이 있다면, A, B 클라이언트에게 사망 알림
    if (deathNotifications.length > 0) {
      const deathNotificationPacket = createResponse(PACKET_TYPE.UNIT_DEATH_NOTIFICATION, {
        deathUnitId: deathNotifications,
      });
      sendPacket.enQueue(socket, deathNotificationPacket);

      const opponentDeathNotificationPacket = createResponse(
        PACKET_TYPE.ENEMY_UNIT_DEATH_NOTIFICATION,
        { opponentDeathUnitId: deathNotifications },
      );
      sendPacket.enQueue(opponentSocket, opponentDeathNotificationPacket);
    }
  } catch (err) {
    handleErr(socket, err);
  }
};

export default attackUnitRequest;
