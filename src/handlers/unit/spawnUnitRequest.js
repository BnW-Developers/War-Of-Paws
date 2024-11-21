import gameSessionManager from '../../classes/managers/gameSessionManager.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { errCodes } from '../../utils/error/errCodes.js';
import { createResponse } from '../../utils/response/createResponse.js';

const spawnUnitRequest = (socket, payload) => {
  const { assetId, toTop } = payload;

  const { playerGameData, opponentPlayerGameData } =
    gameSessionManager.getAllPlayerGameDataBySocket(socket);
  if (!playerGameData || !opponentPlayerGameData)
    throw new CustomErr(errCodes.PLAYER_GAME_DATA_NOT_FOUND, 'Player game data not found');

  // 유닛 데이터 검증
  // TODO: JSON 파일 업데이트 되면 할 것.
  const unitData = dataTable.getUnit(assetId);
  if (!unitData) {
    throw new CustomErr(errCodes.INVALID_ASSET_ID, 'Invalid unit assetId');
  }

  // 골드 확인
  if (playerGameData.getMineral() < unitData.cost) {
    throw new CustomErr(errCodes.UNIT_INSUFFICIENT_FUNDS, 'Not enough minerals');
  }

  playerGameData.spentMineral(unitData.cost);
  // addUnit 함수에서 unit의 instanceId를 발급
  const unitId = playerGameData.addUnit(assetId, toTop);

  const spawnUnitPacket = createResponse(PACKET_TYPE.SPAWN_UNIT_RESPONSE, socket.sequence++, {
    assetId,
    unitId,
    toTop,
  });
  sendPacket.enQueue(socket, spawnUnitPacket); // sendPacket으로 응답 처리

  const opponentSocket = opponentPlayerGameData.getSocket();
  if (!opponentSocket) {
    throw new CustomErr(errCodes.SOCKET_ERR, 'Opponent socket not found');
  }

  const spawnEnemyUnitPacket = createResponse(
    PACKET_TYPE.SPAWN_ENEMY_UNIT_NOTIFICATION,
    opponentSocket.sequence++,
    {
      assetId,
      unitId,
      toTop,
    },
  );
  sendPacket.enQueue(opponentSocket, spawnEnemyUnitPacket); // sendPacket으로 상대방 알림 처리
};

export default spawnUnitRequest;
