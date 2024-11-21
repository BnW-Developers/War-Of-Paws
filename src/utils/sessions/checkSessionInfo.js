import gameSessionManager from '../../classes/managers/gameSessionManager.js';
import userSessionManager from '../../classes/managers/userSessionManager.js';
import CustomErr from '../error/customErr.js';
import { errCodes } from '../error/errCodes.js';

/**
 * 유저&게임세션 관련 정보들을 검증 및 조회
 * @param {net.Socket} socket
 * @returns {{gameSession: Game, gameId: number, user: User, userId: string, userGameData: PlayerGameData, opponent: User, opponentId: string, opponentGameData: PlayerGameData, opponentSocket: net.Socket}}
 */
const checkSessionInfo = (socket) => {
  // 검증: 유저가 존재하는가?
  const user = userSessionManager.getUserBySocket(socket);
  if (!user) {
    throw new CustomErr(errCodes.USER_NOT_FOUND, '유저를 찾지 못했습니다.');
  }
  const userId = userSessionManager.getUserIdBySocket(socket);

  // 검증: 유저가 게임에 참가했는가?
  const gameSession = gameSessionManager.getGameSessionBySocket(socket);
  if (!gameSession) {
    throw new CustomErr(errCodes.GAME_NOT_FOUND, '유저가 플레이중인 게임을 찾지 못했습니다.');
  }
  const gameId = gameSession.getGameId();

  // 검증: 게임이 진행중인가?
  if (!gameSession.isInProgress()) {
    throw new CustomErr(errCodes.GAME_NOT_IN_PROGRESS, `진행중인 게임이 아닙니다.`);
  }

  // 검증: 유저의 인게임 데이터가 존재하는가?
  const userGameData = gameSession.getPlayerGameData(userId);
  if (!userGameData) {
    throw new CustomErr(
      errCodes.PLAYER_GAME_DATA_NOT_FOUND,
      '유저의 인게임 데이터를 찾지 못했습니다.',
    );
  }

  // 검증: 상대방 유저가 존재하는가?
  const opponentId = gameSession.getOpponentUserId(userId);
  const opponent = userSessionManager.getUserByUserId(opponentId);
  if (!opponentId || !opponent) {
    throw new CustomErr(errCodes.OPPONENT_NOT_FOUND, '상대방 유저를 찾을 수 없습니다.');
  }

  // 검증: 상대방 유저의 인게임 데이터가 존재하는가?
  const opponentGameData = gameSession.getPlayerGameData(opponentId);
  if (!opponentGameData) {
    throw new CustomErr(
      errCodes.OPPONENT_GAME_DATA_NOT_FOUND,
      '상대방의 인게임 데이터를 찾을 수 없습니다',
    );
  }

  // 검증: 상대방의 소켓이 존재하는가?
  const opponentSocket = opponent.getSocket();
  if (!opponentSocket) {
    throw new CustomErr(errCodes.OPPONENT_SOCKET_NOT_FOUND, '상대방의 소켓을 찾을 수 없습니다');
  }

  return {
    gameSession,
    gameId,
    user,
    userId,
    userGameData,
    opponent,
    opponentId,
    opponentGameData,
    opponentSocket,
  };
};

export default checkSessionInfo;
