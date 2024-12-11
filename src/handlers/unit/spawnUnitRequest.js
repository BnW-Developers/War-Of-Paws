import { ASSET_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import logger from '../../utils/log/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

const spawnUnitRequest = (socket, payload) => {
  try {
    const { assetId, timestamp, toTop } = payload;

    const { gameSession, userGameData, opponentSocket } = checkSessionInfo(socket);
    logger.info(`spawn unit request id: ${assetId} toTop: ${toTop || false} time: ${timestamp}`);

    // 유닛 데이터 검증
    const unitCost = getGameAssetById(ASSET_TYPE.UNIT, assetId)?.cost;

    // TODO: 필요 건물 지어졌는지 건물 JSON 완성되면

    // 골드 확인
    if (userGameData.getMineral() < unitCost) {
      throw new CustomErr(ERR_CODES.UNIT_INSUFFICIENT_FUNDS, 'Not enough minerals');
    }

    // 골드 차감
    const resultMineral = userGameData.spendMineral(unitCost);

    // 유닛 생성
    const unitId = userGameData.addUnit(gameSession, assetId, toTop || false, timestamp);

    // 패킷 전송
    sendPacket(socket, PACKET_TYPE.SPAWN_UNIT_RESPONSE, {
      assetId,
      unitId,
      toTop,
    });

    sendPacket(socket, PACKET_TYPE.MINERAL_SYNC_NOTIFICATION, { mineral: resultMineral });

    // 패킷 전송
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
