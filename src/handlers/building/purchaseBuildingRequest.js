import PlayerGameData from '../../classes/models/playerGameData.class.js';
import { ASSET_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/log/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

/**
 * 클라이언트로부터 건물 구매 요청을 처리하고, 결과를 응답으로 전송
 * @param {net.Socket} socket
 * @param {{ assetId: int32 }} payload
 */
const purchaseBuildingRequest = (socket, payload) => {
  try {
    const { assetId } = payload;

    const { userGameData, opponentSocket } = checkSessionInfo(socket);

    const resultMineral = processBuildingPurchase(userGameData, assetId);

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

/**
 * 건물 구매를 처리하고 사용자 데이터를 업데이트
 * @param {PlayerGameData} userGameData
 * @param {int32} assetId
 * @returns {resultMineral: int32}
 */
const processBuildingPurchase = (userGameData, assetId) => {
  const buildingCost = getGameAssetById(ASSET_TYPE.BUILDING, assetId)?.cost;

  if (userGameData.isBuildingPurchased(assetId)) {
    throw new CustomErr(
      ERR_CODES.ASSET_NOT_FOUND,
      `Building with assetId ${assetId} already purchased`,
    );
  }

  if (userGameData.getMineral() < buildingCost) {
    throw new CustomErr(ERR_CODES.BUILDING_INSUFFICIENT_FUNDS, 'Not enough minerals');
  }

  const resultMineral = userGameData.spendMineral(buildingCost);
  userGameData.addBuilding(assetId);

  return resultMineral;
};

export default purchaseBuildingRequest;
