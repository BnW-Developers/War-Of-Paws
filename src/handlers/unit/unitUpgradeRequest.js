import { ASSET_TYPE } from '../../constants/assets.js';
import { UPGRADE_COSTS } from '../../constants/game.constants.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

/**
 * 유닛 업그레이드 요청 핸들러
 * @param {net.Socket} socket
 * @param {{ assetId: int32, upgradeType: string }} payload
 */
const unitUpgradeRequest = (socket, payload) => {
  try {
    const { assetId, upgradeType } = payload;
    const eliteAssetId = assetId + 1000;

    const { userGameData, opponentSocket } = checkSessionInfo(socket);

    // 유효성 검사
    const unitData = getGameAssetById(ASSET_TYPE.UNIT, assetId);
    if (!unitData) {
      throw new CustomErr(ERR_CODES.INVALID_ASSET_ID, `Invalid asset ID: ${assetId}`);
    }

    const upgradeCost = getUpgradeCost(upgradeType);
    if (userGameData.getMineral() < upgradeCost) {
      throw new CustomErr(ERR_CODES.UNIT_INSUFFICIENT_FUNDS, 'Not enough minerals');
    }

    // 레벨 업그레이드
    const resultLevel = userGameData.applyUpgradeLevel(assetId, upgradeType);
    // 동일 계통 엘리트도 업그레이드 됨
    userGameData.applyUpgradeLevel(eliteAssetId, upgradeType);

    // 자원 차감 TODO: MINERAL SYNC
    const resultMineral = userGameData.spendMineral(upgradeCost);

    sendPacket(socket, PACKET_TYPE.MINERAL_SYNC_NOTIFICATION, { resultMineral });

    // 응답 전송
    sendPacket(socket, PACKET_TYPE.UNIT_UPGRADE_RESPONSE, {
      assetId,
      resultLevel,
      upgradeType,
    });

    // 상대방에게 노티피케이션 전송
    sendPacket(opponentSocket, PACKET_TYPE.UNIT_UPGRADE_NOTIFICATION, {
      assetId,
      resultLevel,
      upgradeType,
    });
  } catch (err) {
    handleErr(socket, err);
  }
};

/**
 * 업그레이드 비용을 반환
 * @param {string} upgradeType
 * @returns {int32}
 */
const getUpgradeCost = (upgradeType) => {
  const cost = UPGRADE_COSTS[upgradeType];
  if (!cost) {
    throw new CustomErr(ERR_CODES.INVALID_UPGRADE_TYPE, `Invalid upgrade type: ${upgradeType}`);
  }
  return cost;
};

export default unitUpgradeRequest;
