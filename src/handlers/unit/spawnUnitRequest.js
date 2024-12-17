import { PACKET_TYPE } from '../../constants/header.js';
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

    userGameData.removeCard(assetId);
    const unitId = userGameData.addUnit(gameSession, assetId, toTop || false, timestamp);

    sendPacket(socket, PACKET_TYPE.SPAWN_UNIT_RESPONSE, {
      assetId,
      unitId,
      toTop,
    });

    sendPacket(opponentSocket, PACKET_TYPE.SPAWN_ENEMY_UNIT_NOTIFICATION, {
      assetId,
      unitId,
      toTop,
    });
  } catch (err) {
    handleErr(socket, err);
  }
};

export default spawnUnitRequest;
