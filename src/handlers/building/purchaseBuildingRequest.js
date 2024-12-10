import { ASSET_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

/**
 * 클라이언트로부터 건물 구매 요청을 처리하고, 결과를 응답으로 전송
 * @param {Object} socket - 건물 구매 요청을 보낸 플레이어의 소켓 객체
 * @param {string} payload.assetId - 구매할 건물의 자산 ID
 */
const purchaseBuildingRequest = (socket, payload) => {
  try {
    const { assetId } = payload;

    const { userGameData, opponentSocket } = checkSessionInfo(socket);

    const { resultMineral } = processBuildingPurchase(userGameData, assetId);

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
 * 건물 구매 처리
 * @param {Object} userGameData - 사용자 게임 데이터
 * @param {string} assetId - 구매할 건물의 자산 ID
 * @returns {Object} - 남은 자원 정보
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

  return { resultMineral };
};

export default purchaseBuildingRequest;
