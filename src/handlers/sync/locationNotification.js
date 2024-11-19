import { handleErr } from '../../utils/error/handlerErr.js';
import gameSessionManager from '../../classes/managers/gameSessionManager';
import { errCodes } from '../../utils/error/errCodes.js';
import CustomErr from '../../utils/error/customErr';
import userSessionManager from '../../classes/managers/userSessionManager';
import locationSyncManager from '../../classes/managers/locationSyncManager.js';

/**
 * 위치 동기화 핸들러
 * @param {net.Socket} socket
 * @param {{unitPositions: {unitId: int32, position: {x: float, z: float}[]}}} payload
 */
const locationNotification = (socket, payload) => {
  try {
    // 검증: 유저가 존재하는가?
    const user = userSessionManager.getUserBySocket(socket);
    if (!user) {
      throw new CustomErr(errCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
    }
    const userId = user.getUserId();

    // 검증: 유저가 게임에 참가했는가?
    const gameSession = gameSessionManager.getGameSessionBySocket(socket);
    if (!gameSession) {
      throw new CustomErr(errCodes.GAME_NOT_FOUND, '유저가 플레이중인 게임을 찾지 못했습니다.');
    }
    const gameId = gameSession.getGameId();

    // 검증: 플레이어 데이터가 존재하는가?
    const playerGameData = gameSession.getPlayerGameData(userId);
    if (!playerGameData) {
      throw new CustomErr(
        errCodes.PLAYER_GAME_DATA_NOT_FOUND,
        '유저의 게임 데이터를 찾지 못했습니다.',
      );
    }

    // 검증: 게임이 진행중인가?
    const gameState = gameSession.state;
    if (!gameSession.isInProgress()) {
      throw new CustomErr(errCodes.GAME_NOT_IN_PROGRESS, `진행중인 게임이 아닙니다.`);
    }

    // 해당 클라이언트가 보유한 유닛들의 위치
    const { unitPositions } = payload;

    const syncPositions = [];
    for (const unitPosition of unitPositions) {
      const { unitId, position } = unitPosition;

      // 검증: 해당 플레이어가 보유한 (소환한) 유닛인가?
      const unit = playerGameData.getUnit(unitId);
      if (!unit) {
        throw new CustomErr(errCodes.UNOWNED_UNIT, '유저가 보유한 유닛이 아닙니다.');
      }

      const actualPosition = [position.x, 0, position.z];
      // TODO: 서버에서 예측한 유닛의 위치값
      const expectedPosition = [0, 0, 0]; // x, y, z
      const marginOfError = [0, 0, 0]; // x, y, z

      // 서버의 계산값과 비교하여 위치값을 보정
      const { adjustedPosition, modified } = locationSyncManager.adjustPosition(
        actualPosition,
        expectedPosition,
        marginOfError,
      );

      const syncPosition = { unitId, position: adjustedPosition, modified };
      syncPositions.push(syncPosition);
    }

    // 보정한 위치를 동기화 위치 배열에 추가
    locationSyncManager.addSyncPositions(gameId, userId, syncPositions);

    // 두 클라이언트로부터 위치값을 모두 받았을 때 상태동기화 실행
    if (locationSyncManager.isSyncReady(gameId)) {
      // 검증: 상대방 유저의 플레이어 데이터가 존재하는가?
      const opponentGameData = gameSession.getOpponentGameDataByUserId(userId);
      if (!opponentGameData) {
        throw new CustomErr(
          errCodes.OPPONENT_GAME_DATA_NOT_FOUND,
          '상대방의 게임 데이터를 찾을 수 없습니다',
        );
      }
      const opponentId = opponentGameData.getUserId();

      // 검증: 상대방의 소켓이 존재하는가?
      const opponentSocket = opponentGameData.getSocket();
      if (!opponentSocket) {
        throw new CustomErr(errCodes.OPPONENT_SOCKET_NOT_FOUND, '상대방의 소켓을 찾을 수 없습니다');
      }

      // 위치동기화 실행
      locationSyncManager.syncPositions(gameId, userId, opponentId, socket, opponentSocket);
    }
  } catch (err) {
    handleErr(socket, err);
  }
};

export default locationNotification;
