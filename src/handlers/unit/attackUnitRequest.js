import { PACKET_TYPE } from '../../constants/header.js';
import logger from '../../utils/logger.js';
import { createResponse } from '../../utils/response/createResponse.js';

const attackUnitRequest = (socket, payload) => {
  const { unitId, opponentUnitIds, sequence } = payload; // 여러 대상 유닛 처리
  const user = getUserBySocket(socket);
  const userId = user.getUserId();

  // 게임 세션 가져오기
  const gameSession = getGameSessionByUserId(userId);
  if (!gameSession) {
    const message = 'Game session not found';
    logger.error(message);
    socket.write(createResponse(PACKET_TYPE.ERROR_NOTIFICATION, sequence, { message }));
    return;
  }

  // 유저 상태 가져오기
  const myGameState = gameSession.getGameState(userId);
  if (!myGameState) {
    const message = 'Player game state not found';
    logger.error(message);
    socket.write(createResponse(PACKET_TYPE.ERROR_NOTIFICATION, sequence, { message }));
    return;
  }

  // 상대방 상태 가져오기
  const opponentUser = gameSession.getOpponentUserByUserId(userId);
  if (!opponentUser) {
    const message = 'Opponent user not found';
    logger.error(message);
    socket.write(createResponse(PACKET_TYPE.ERROR_NOTIFICATION, sequence, { message }));
    return;
  }

  const opponentUserId = opponentUser.getUserId();
  const opponentGameState = gameSession.getGameState(opponentUserId);
  if (!opponentGameState) {
    const message = 'Opponent game state not found';
    logger.error(message);
    socket.write(createResponse(PACKET_TYPE.ERROR_NOTIFICATION, sequence, { message }));
    return;
  }

  // 공격 유닛 가져오기
  const attackUnit = myGameState.getUnitById(unitId);

  // 결과 저장용 배열
  const opponentUnitInfos = [];
  const deathNotifications = [];

  // 대상 유닛 처리
  for (const opponentUnitId of opponentUnitIds) {
    const targetUnit = opponentGameState.getUnitById(opponentUnitId);

    // 데미지 적용
    targetUnit.hp -= attackUnit.attack;

    // 사망 여부 확인
    if (targetUnit.hp <= 0) {
      opponentGameState.removeUnit(opponentUnitId); // 상대방 유닛 제거
      deathNotifications.push(opponentUnitId); // 사망 알림 추가
    }

    // 공격당한 유닛 정보 추가
    opponentUnitInfos.push({
      opponentUnitId,
      opponentUnitHp: Math.max(0, targetUnit.hp), // HP는 음수가 될 수 없도록 처리
    });
  }

  // 공격 알림
  socket.write(createResponse(PACKET_TYPE.ATTACK_UNIT_RESPONSE, sequence, { opponentUnitInfos }));

  // 상대방 공격 알림
  const opponentSocket = opponentUser.getSocket();
  if (opponentSocket) {
    opponentSocket.write(
      createResponse(PACKET_TYPE.ENEMY_UNIT_ATTACK_NOTIFICATION, sequence, {
        unitInfos: opponentUnitInfos,
      }),
    );
  } else {
    logger.warn(`Opponent socket not found for userId: ${opponentUserId}`);
  }

  // A, B 클라이언트에게 사망 알림
  if (deathNotifications.length > 0) {
    socket.write(
      createResponse(PACKET_TYPE.UNIT_DEATH_NOTIFICATION, sequence, {
        deathUnitId: deathNotifications,
      }),
    );

    opponentSocket.write(
      createResponse(PACKET_TYPE.ENEMY_UNIT_DEATH_NOTIFICATION, sequence, {
        opponentDeathUnitId: deathNotifications,
      }),
    );
  }
};

export default attackUnitRequest;
