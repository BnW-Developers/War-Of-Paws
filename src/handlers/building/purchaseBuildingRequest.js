import { PACKET_TYPE } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

const purchaseBuildingRequest = (socket, payload) => {
  // sequence 처리 물어보기.
  const { assetId } = payload;
  const user = getUserBySocket(socket);
  const userId = user.getUserId();

  // getGameSessionBy userId?
  const gameSession = getGameSessionByUserId(userId); // userId로 게임 세션 가져오기
  if (!gameSession) {
    const message = 'Game session not found';
    logger.error(message);
    createResponse(PACKET_TYPE.ERROR, sequence, { message }); // 에러 패킷이 있으니 err 파라미터는 없어도 되지 않을까?
  }

  /* 반복되는 형태 함수로 묶기 고려해보기.
  const handleError = (socket, packetType, sequence, message) => {
    logger.error(message);
    sendResponse(socket, packetType, sequence, { message });
  };

  사용 예
  if (!gameSession) {
    handleError(socket, PACKET_TYPE.ERROR, sequence, 'Game session not found');
    return;
  }
  */

  // gameState는 Redis로?
  gameState = gameSession.getGameState(userId);
  if (!gameState) {
    const message = 'Player state not found';
    logger.error(message);
    createResponse(PACKET_TYPE.ERROR, sequence, { message });
    return;
  }

  // assetId로 dataTable에서 해당 건물의 골드 가져오기 + dataTable에 존재하는 assetId인지도 검증 가능
  // 건물의 가격.. 유닛 스탯..
  const buildingCost = dataTable.getBuildingCost(assetId);
  if (buildingCost === undefined) {
    const message = 'Invalid building assetId';
    logger.error(message);
    createResponse(PACKET_TYPE.ERROR, sequence, { message });
  }

  // 여기에 이미 구매한 건물인지 체크?
  if (gameState.buildings.includes(assetId)) {
    const message = 'Building already purchased';
    logger.error(message);
    createResponse(PACKET_TYPE.ERROR, sequence, { message });
    return;
  }

  // 골드가 충분한지 확인
  if (gameState.mineral < buildingCost) {
    const message = 'Not enough minerals';
    logger.error(message);
    createResponse(PACKET_TYPE.ERROR, sequence, { message });
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
    createResponse(PACKET_TYPE.ERROR, sequence, message);
    return;
  }
  opponnetSocket.write(
    createResponse(PACKET_TYPE.PURCHASE_BUILDING_RESPONSE, sequence, { assetId }),
  );
};

export default purchaseBuildingRequest;
