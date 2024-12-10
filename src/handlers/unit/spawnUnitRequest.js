import { ASSET_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

/**
 * 클라이언트로부터 유닛 생성 요청을 처리하고, 생성된 유닛 정보를 응답으로 전송
 * @param {Object} socket - 유닛 생성 요청을 보낸 플레이어의 소켓 객체
 * @param {string} payload.assetId - 생성할 유닛의 자산 ID
 * @param {number} payload.timestamp - 유닛 생성 요청이 발생한 타임스탬프
 * @param {boolean} payload.toTop - 유닛이 상단으로 배치될지 여부
 */
const spawnUnitRequest = (socket, payload) => {
  try {
    const { assetId, timestamp, toTop } = payload;

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
 * @param {Object} userGameData - 사용자 게임 데이터
 * @param {Object} gameSession - 현재 게임 세션
 * @param {string} assetId - 생성할 유닛의 자산 ID
 * @param {boolean} toTop - 유닛이 상단으로 배치될지 여부
 * @param {number} timestamp - 유닛 생성 요청이 발생한 타임스탬프
 * @returns {Object} - 생성된 유닛 ID와 남은 자원
 */
const processUnitSpawn = (userGameData, gameSession, assetId, toTop, timestamp) => {
  const unitCost = getUnitCost(assetId);

  validateMineral(userGameData.getMineral(), unitCost);

  const resultMineral = userGameData.spendMineral(unitCost);
  const unitId = userGameData.addUnit(gameSession, assetId, toTop || false, timestamp);

  return { unitId, resultMineral };
};

/**
 * 유닛의 비용을 반환
 * @param {string} assetId - 유닛의 자산 ID
 * @returns {number} - 유닛 비용
 */
const getUnitCost = (assetId) => {
  const unitCost = getGameAssetById(ASSET_TYPE.UNIT, assetId)?.cost;
  if (typeof unitCost === 'undefined') {
    throw new CustomErr(ERR_CODES.INVALID_ASSET_ID, 'Invalid unit asset ID');
  }
  return unitCost;
};

/**
 * 유저의 자원이 유닛 생성에 충분한지 검증
 * @param {number} currentMineral - 현재 유저의 자원
 * @param {number} unitCost - 유닛 비용
 */
const validateMineral = (currentMineral, unitCost) => {
  if (currentMineral < unitCost) {
    throw new CustomErr(ERR_CODES.UNIT_INSUFFICIENT_FUNDS, 'Not enough minerals');
  }
};

export default spawnUnitRequest;
