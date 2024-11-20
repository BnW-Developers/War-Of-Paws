import gameSessionManager from '../../classes/managers/gameSessionManager.js';
import userSessionManager from '../../classes/managers/userSessionManager.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { errCodes } from '../../utils/error/errCodes.js';
import { createResponse } from '../../utils/response/createResponse.js';

const spawnUnitRequest = (socket, payload) => {
  const { assetId, toTop } = payload;

  // 사용자 확인
  const user = userSessionManager.getUserBySocket(socket);
  if (!user) {
    throw new CustomErr(errCodes.USER_NOT_FOUND, 'User not found');
  }

  // 게임 세션 가져오기
  const gameSession = gameSessionManager.getGameSessionById(user.getCurrentGameId());
  if (!gameSession) {
    throw new CustomErr(errCodes.GAME_NOT_ACTIVE, 'Game session not found');
  }

  // 플레이어 상태 가져오기
  const playerGameData = user.getPlayerGameData();
  if (!playerGameData) {
    throw new CustomErr(errCodes.PLAYER_GAME_DATA_NOT_FOUND, 'Player state not found');
  }

  // 유닛 데이터 검증
  // TODO: JSON 파일 업데이트 되면 할 것.
  const unitData = dataTable.getUnit(assetId);
  if (!unitData) {
    throw new CustomErr(errCodes.INVALID_ASSET_ID, 'Invalid unit assetId');
  }

  // 골드 확인
  if (playerGameData.getMineral() < unitData.cost) {
    throw new CustomErr(errCodes.UNIT_INSUFFICIENT_FUNDS, 'Not enough minerals');
  }

  gameState.spentMineral(unitData.cost);
  // addUnit 함수에서 unit의 instanceId를 발급
  const unitId = gameState.addUnit(assetId, toTop);

  const spawnUnitPacket = createResponse(PACKET_TYPE.SPAWN_UNIT_RESPONSE, socket.sequence++, {
    assetId,
    instanceId,
    toTop,
  });
  sendPacket.enQueue(socket, spawnUnitPacket); // sendPacket으로 응답 처리

  // 상대방 알림
  const opponentUser = gameSession.getOpponentUserByUserId(user.getUserId());
  if (!opponentUser) {
    throw new CustomErr(errCodes.OPPONENT_NOT_FOUND, 'Opponent not found');
  }

  const opponentSocket = opponentUser.getSocket();
  if (!opponentSocket) {
    throw new CustomErr(errCodes.SOCKET_ERR, 'Opponent socket not found');
  }

  const spawnEnemyUnitPacket = createResponse(
    PACKET_TYPE.SPAWN_ENEMY_UNIT_NOTIFICATION,
    opponentSocket.sequence++,
    {
      assetId,
      instanceId,
      toTop,
    },
  );
  sendPacket.enQueue(opponentSocket, spawnEnemyUnitPacket); // sendPacket으로 상대방 알림 처리
};

export default spawnUnitRequest;
