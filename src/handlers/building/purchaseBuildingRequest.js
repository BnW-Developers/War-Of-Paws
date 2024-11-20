import gameSessionManager from '../../classes/managers/gameSessionManager.js';
import userSessionManager from '../../classes/managers/userSessionManager.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { errCodes } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { createResponse } from '../../utils/response/createResponse.js';

const purchaseBuildingRequest = (socket, payload) => {
  try {
    // sequence 처리 물어보기.
    const { assetId } = payload;

    const user = userSessionManager.getUserBySocket(socket);
    if (!user) {
      throw new CustomErr(errCodes.USER_SESSION_NOT_FOUND, 'User not found');
    }
    const userId = user.getUserId();

    const gameSession = gameSessionManager.getGameSessionById(user.getCurrentGameId()); // userId로 게임 세션 가져오기
    if (!gameSession) {
      throw new CustomErr(errCodes.GAME_NOT_ACTIVE, 'Game Session not found');
    }

    const playerState = gameSession.getUserByUserId(userId);
    if (!gameState) {
      throw new CustomErr(errCodes.GAME_NOT_ACTIVE, 'Game Session not found');
    }

    // assetId 적합성 확인
    // TODO: JSON 생기면 getBuildingCost 함수 구현
    const buildingCost = playerState.getBuildingCost(assetId);
    if (buildingCost === undefined || gameState.buildings.includes(assetId)) {
      throw new CustomErr(errCodes.ASSET_NOT_FOUND, 'Invalid building assetId');
    }

    // 골드가 충분한지 확인
    if (gameState.getMineral() < buildingCost) {
      throw new CustomErr(errCodes.BUILDING_INSUFFICIENT_FUNDS, 'Not enough minerals');
    }

    // 골드 차감
    gameState.spentMineral(buildingCost);

    // buildings에 추가
    gameState.addBuilding(assetId);

    const packet = createResponse(PACKET_TYPE.PURCHASE_BUILDING_RESPONSE, socket.sequence++, {
      assetId,
    });
    sendPacket.enQueue(socket, packet);

    const opponentUser = gameSession.getOpponentUserByUserId(userId);
    const opponnetSocket = opponentUser.getSocket();

    if (!opponnetSocket) {
      throw new CustomErr(errCodes.SOCKET_ERR, 'Opponent Socket not found');
    }

    const opponentPacket = createResponse(
      PACKET_TYPE.ADD_ENEMY_BUILDING_NOTIFICATION,
      socket.sequence++,
      {
        assetId,
      },
    );
    sendPacket.enQueue(socket, opponentPacket);
  } catch (err) {
    handleErr(socket, err);
  }
};

export default purchaseBuildingRequest;
