import gameSessionManager from '../../classes/managers/gameSessionManager.js';
import sendPacket from '../../classes/models/sendPacket.class.js';
import { ASSET_TYPE } from '../../constants/assets.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { createResponse } from '../../utils/response/createResponse.js';

const spawnUnitRequest = (socket, payload) => {
  try {
    const { assetId, toTop } = payload;

    const { playerGameData, opponentPlayerGameData } =
      gameSessionManager.getAllPlayerGameDataBySocket(socket);
    if (!playerGameData || !opponentPlayerGameData)
      throw new CustomErr(ERR_CODES.PLAYER_GAME_DATA_NOT_FOUND, 'Player game data not found');

    // 유닛 데이터 검증
    const unitCost = getGameAssetById(ASSET_TYPE.UNIT, assetId)?.cost;

    // 골드 확인
    if (playerGameData.getMineral() < unitCost) {
      throw new CustomErr(ERR_CODES.UNIT_INSUFFICIENT_FUNDS, 'Not enough minerals');
    }

    // 골드 차감
    playerGameData.spendMineral(unitCost);

    // 유닛 생성
    const unitId = playerGameData.addUnit(assetId, toTop);

    // 응답 생성
    const spawnUnitPacket = createResponse(PACKET_TYPE.SPAWN_UNIT_RESPONSE, socket.sequence++, {
      assetId,
      unitId,
      toTop,
    });
    sendPacket.enQueue(socket, spawnUnitPacket);

    const opponentSocket = opponentPlayerGameData.getSocket();
    if (!opponentSocket) {
      throw new CustomErr(ERR_CODES.SOCKET_ERR, 'Opponent socket not found');
    }

    // 응답 생성
    const spawnEnemyUnitPacket = createResponse(
      PACKET_TYPE.SPAWN_ENEMY_UNIT_NOTIFICATION,
      opponentSocket.sequence++,
      {
        assetId,
        unitId,
        toTop,
      },
    );
    sendPacket.enQueue(opponentSocket, spawnEnemyUnitPacket);
  } catch (err) {
    handleErr(socket, err);
  }
};

export default spawnUnitRequest;
