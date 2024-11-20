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

    // assetId로 dataTable에서 해당 건물의 골드 가져오기 + dataTable에 존재하는 assetId인지도 검증 가능
    // 건물의 가격.. 유닛 스탯..
    const buildingCost = dataTable.getBuildingCost(assetId);
    if (buildingCost === undefined) {
      const message = 'Invalid building assetId';
      logger.error(message);
      createResponse(PACKET_TYPE.ERROR_NOTIFICATION, sequence, { message });
    }

    // 여기에 이미 구매한 건물인지 체크?
    if (gameState.buildings.includes(assetId)) {
      const message = 'Building already purchased';
      logger.error(message);
      createResponse(PACKET_TYPE.ERROR_NOTIFICATION, sequence, { message });
      return;
    }

    // 골드가 충분한지 확인
    if (gameState.mineral < buildingCost) {
      const message = 'Not enough minerals';
      logger.error(message);
      createResponse(PACKET_TYPE.ERROR_NOTIFICATION, sequence, { message });
      return;
    }

    // 골드 차감
    gameState.addMineral(-buildingCost);

    // buildings에 추가
    gameState.addBuilding(assetId);

    socket.write(createResponse(PACKET_TYPE.PURCHASE_BUILDING_RESPONSE, sequence, { assetId }));
    // createResponse => sendResponse로 함수명을 바꾸고 socket을 인자로 줘서
    // sendResponse(socket, packetType, payload, ...) 로 사용하는 것 ??

    const opponentUser = gameSession.getOpponentUserByUserId(userId);
    const opponnetSocket = opponentUser.getSocket();

    if (!opponnetSocket) {
      const message = 'Opponent socket not found';
      logger.error(message);
      createResponse(PACKET_TYPE.ERROR_NOTIFICATION, sequence, message);
      return;
    }
    opponnetSocket.write(
      createResponse(PACKET_TYPE.PURCHASE_BUILDING_RESPONSE, sequence, { assetId }),
    );
  } catch (err) {
    handleErr(socket, err);
  }
};

export default purchaseBuildingRequest;
