import gameSessionManager from '../../classes/managers/gameSessionManager.js';
import userSessionManager from '../../classes/managers/userSessionManager.js';

const gameStartRequest = (socket) => {
  const user = userSessionManager.getUserBySocket(socket);
  if (!user || !user.getCurrentGameId()) return;
  const gameSession = gameSessionManager.getGameSessionByGameId(user.getCurrentGameId());
  if (!gameSession) return;

  gameSession.handleGameStartRequest(user.userId);
};

export default gameStartRequest;
