import Game from '../../classes/models/game.class.js'; // eslint-disable-line
import PlayerGameData from '../../classes/models/playerGameData.class.js'; // eslint-disable-line
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
 * 클라이언트로부터 유닛 생성 요청을 처리하고, 생성된 유닛 정보를 응답으로 전송
 * @param {net.Socket} socket
 * @param {{ assetId: Int32Array, toTop: boolean }} payload
 */
const spawnUnitRequest = (socket, payload) => {
  try {
    const { assetId, toTop } = payload;
    const timestamp = Date.now();

    const { gameSession, userGameData, opponentSocket } = checkSessionInfo(socket);
    logger.info(`spawn unit request id: ${assetId} toTop: ${toTop || false} time: ${timestamp}`);

    const { unitId, resultMineral } = processUnitSpawn(
      userGameData,
      gameSession,
      assetId,
      toTop,
      timestamp,
    );

    sendPacket(socket, PACKET_TYPE.SPAWN_UNIT_RESPONSE, {
      assetId,
      unitId,
      toTop,
    });

    sendPacket(socket, PACKET_TYPE.MINERAL_SYNC_NOTIFICATION, { mineral: resultMineral });

    sendPacket(opponentSocket, PACKET_TYPE.SPAWN_ENEMY_UNIT_NOTIFICATION, {
      assetId,
      unitId,
      toTop,
    });
  } catch (err) {
    handleErr(socket, err);
  }
};

/**
 * 유닛 생성 처리
 * @param {PlayerGameData} userGameData
 * @param {Game} gameSession
 * @param {int32} assetId
 * @param {boolean} toTop
 * @param {int64} timestamp
 * @returns {{ unitId: number, resultMineral: number }} // 생성된 유닛 id와 남은 골드
 */
const processUnitSpawn = (userGameData, gameSession, assetId, toTop, timestamp) => {
  const unitCost = getUnitCost(assetId);

  if (userGameData.getMineral() < unitCost) {
    throw new CustomErr(ERR_CODES.UNIT_INSUFFICIENT_FUNDS, 'Not enough minerals');
  }

  const resultMineral = userGameData.spendMineral(unitCost);
  const unitId = userGameData.addUnit(gameSession, assetId, toTop || false, timestamp);

  return { unitId, resultMineral };
};

/**
 * 유닛의 비용을 반환
 * @param {int32} assetId
 * @returns {int32}
 */
const getUnitCost = (assetId) => {
  const unitCost = getGameAssetById(ASSET_TYPE.UNIT, assetId)?.cost;
  if (typeof unitCost === 'undefined') {
    throw new CustomErr(ERR_CODES.INVALID_ASSET_ID, 'Invalid unit asset ID');
  }
  return unitCost;
};

export default spawnUnitRequest;
