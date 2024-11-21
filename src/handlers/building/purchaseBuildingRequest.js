import gameSessionManager from '../../classes/managers/gameSessionManager.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { errCodes } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { createResponse } from '../../utils/response/createResponse.js';

const purchaseBuildingRequest = (socket, payload) => {
  try {
    const { assetId } = payload;

    const { playerGameData, opponentPlayerGameData } =
      gameSessionManager.getAllPlayerGameDataBySocket(socket);
    if (!playerGameData || !opponentPlayerGameData)
      throw new CustomErr(errCodes.PLAYER_GAME_DATA_NOT_FOUND, 'Player game data not found');

    // assetId 적합성 확인
    // TODO: JSON 생기면 getBuildingCost 함수 구현
    const buildingCost = playerGameData.getBuildingCost(assetId);
    if (buildingCost === undefined || playerGameData.buildings.includes(assetId)) {
      throw new CustomErr(errCodes.ASSET_NOT_FOUND, 'Invalid building assetId');
    }

    // 골드가 충분한지 확인
    if (playerGameData.getMineral() < buildingCost) {
      throw new CustomErr(errCodes.BUILDING_INSUFFICIENT_FUNDS, 'Not enough minerals');
    }

    // 골드 차감
    playerGameData.spentMineral(buildingCost);

    // buildings에 추가
    playerGameData.addBuilding(assetId);

    const purchaseBuildingPacket = createResponse(
      PACKET_TYPE.PURCHASE_BUILDING_RESPONSE,
      socket.sequence++,
      {
        assetId,
      },
    );
    sendPacket.enQueue(socket, purchaseBuildingPacket);

    const opponnetSocket = opponentPlayerGameData.getSocket();
    if (!opponnetSocket) {
      throw new CustomErr(errCodes.SOCKET_ERR, 'Opponent Socket not found');
    }

    const enemyBuildingPacket = createResponse(
      PACKET_TYPE.ADD_ENEMY_BUILDING_NOTIFICATION,
      socket.sequence++,
      {
        assetId,
      },
    );
    sendPacket.enQueue(opponnetSocket, enemyBuildingPacket);
  } catch (err) {
    handleErr(socket, err);
  }
};

export default purchaseBuildingRequest;
