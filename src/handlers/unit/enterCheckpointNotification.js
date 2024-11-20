import userSessionManager from '../../classes/managers/userSessionManager.js';
import gameSessionManager from './../../classes/managers/gameSessionManager.js';

const enterCheckpointNotification = (socket, payload) => {
  const { isTop, unitId } = payload;

  // 유저 불러오기
  const user = userSessionManager.getUserBySocket(socket);
  if (!user) {
    throw new Error('User not found');
  }
  const gameId = user.getCurrentGameId();

  // 게임세션 불러오기
  const game = gameSessionManager.getGameByGameId(gameId);
  if (!game) {
    throw new Error('Game not found');
  }
  // 체크포인트 매니저 불러오기
  const CheckPointManager = game.getCheckPointManager();
  if (!CheckPointManager) {
    throw new Error('CheckPointManager not found');
  }

  //메서드 실행
  CheckPointManager.addUnit(isTop, unitId);
};

export default enterCheckpointNotification;
