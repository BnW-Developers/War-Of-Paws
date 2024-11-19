import { PACKET_TYPE } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

const spawnUnitRequest = (socket, payload) => {
  const { assetId, toTop } = payload;
  const user = getUserBySocket(socket);
  const userId = user.getUserId();

  const gameSession = getGameSessionByUserId(userId);
  if (!gameSession) {
    const message = 'Game session not found';
    logger.error(message);
    socket.write(createResponse(PACKET_TYPE.ERROR_NOTIFICATION, sequence, { message }));
    return;
  }

  // 유저 상태 가져오기
  const gameState = gameSession.getGameState(userId);
  if (!gameState) {
    const message = 'Player state not found';
    logger.error(message);
    socket.write(createResponse(PACKET_TYPE.ERROR_NOTIFICATION, sequence, { message }));
    return;
  }

  // assetId 검증
  const unit = dataTable.getUnit(assetId); // unit은 객체? cost, hp, attack?
  if (unit === undefined) {
    const message = 'Invalid unit assetId';
    logger.error(message);
    socket.write(createResponse(PACKET_TYPE.ERROR_NOTIFICATION, sequence, { message }));
    return;
  }

  // 골드가 충분한지 검증
  if (gameState.mineral < unit.cost) {
    const message = 'Not enough minerals';
    logger.error(message);
    socket.write(createResponse(PACKET_TYPE.ERROR_NOTIFICATION, sequence, { message }));
    return;
  }

  gameState.addMineral(-unit.cost);
  // addUnit 함수에서 unit의 instanceId를 발급
  const instanceId = gameState.addUnit(assetId, toTop);

  // 응답 전송
  const responseData = { assetId, instanceId, toTop };
  socket.write(createResponse(PACKET_TYPE.SPAWN_UNIT_RESPONSE, sequence, responseData));

  // 상대방 알림
  const opponentUser = gameSession.getOpponentUserByUserId(userId);
  const opponnetSocket = opponentUser.getSocket();

  if (!opponnetSocket) {
    const message = 'Opponent socket not found';
    logger.error(message);
    createResponse(PACKET_TYPE.ERROR_NOTIFICATION, sequence, message);
    return;
  }
  opponnetSocket.write(
    createResponse(PACKET_TYPE.SPAWN_ENEMY_UNIT_NOTIFICATION, sequence, responseData),
  );
};

export default spawnUnitRequest;
