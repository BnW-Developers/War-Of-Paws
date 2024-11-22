import gameSessionManager from '../../classes/managers/gameSessionManager.js';
import { ASSET_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { createResponse } from '../../utils/response/createResponse.js';

const purchaseBuildingRequest = (socket, payload) => {
  try {
    const { assetId } = payload;

    const { playerGameData, opponentPlayerGameData } =
      gameSessionManager.getAllPlayerGameDataBySocket(socket);
    if (!playerGameData || !opponentPlayerGameData)
      throw new CustomErr(ERR_CODES.PLAYER_GAME_DATA_NOT_FOUND, 'Player game data not found');

    const buildingCost = getGameAssetById(ASSET_TYPE.BUILDING, assetId)?.cost;

    // JSON에 해당 assetId에 해당하는 건물이 있는지 || 이미 유저가 구매한 빌딩인지 체크
    if (buildingCost === undefined || playerGameData.buildings.includes(assetId)) {
      throw new CustomErr(ERR_CODES.ASSET_NOT_FOUND, 'Invalid building assetId');
    }

    // 골드가 충분한지 확인
    if (playerGameData.getMineral() < buildingCost) {
      throw new CustomErr(ERR_CODES.BUILDING_INSUFFICIENT_FUNDS, 'Not enough minerals');
    }

    // 골드 차감
    playerGameData.spendMineral(buildingCost);

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
      throw new CustomErr(ERR_CODES.SOCKET_ERR, 'Opponent Socket not found');
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
