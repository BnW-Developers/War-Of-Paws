import { ASSET_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/log/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

const purchaseBuildingRequest = (socket, payload) => {
  try {
    const { assetId } = payload;

    const { userGameData, opponentSocket } = checkSessionInfo(socket);
    logger.info(`purchase building request id: ${assetId}`);

    const buildingCost = getGameAssetById(ASSET_TYPE.BUILDING, assetId)?.cost;

    // JSON에 해당 assetId에 해당하는 건물이 있는지 || 이미 유저가 구매한 빌딩인지 체크
    if (buildingCost === undefined || userGameData.buildings.includes(assetId)) {
      throw new CustomErr(ERR_CODES.ASSET_NOT_FOUND, 'Invalid building assetId');
    }

    // 골드가 충분한지 확인
    if (userGameData.getMineral() < buildingCost) {
      throw new CustomErr(ERR_CODES.BUILDING_INSUFFICIENT_FUNDS, 'Not enough minerals');
    }

    // 골드 차감
    const resultMineral = userGameData.spendMineral(buildingCost);

    // buildings에 추가
    userGameData.addBuilding(assetId);

    sendPacket(socket, PACKET_TYPE.PURCHASE_BUILDING_RESPONSE, {
      assetId,
    });

    sendPacket(socket, PACKET_TYPE.MINERAL_SYNC_NOTIFICATION, { mineral: resultMineral });

    sendPacket(opponentSocket, PACKET_TYPE.ADD_ENEMY_BUILDING_NOTIFICATION, {
      assetId,
    });
  } catch (err) {
    handleErr(socket, err);
  }
};

export default purchaseBuildingRequest;
