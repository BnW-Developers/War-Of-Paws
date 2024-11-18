import { config } from '../../config/config.js';
import PlayerGameData from './PlayerGameData.class.js';

class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.players = new Map();
    this.isStarted = false;
  }

  getGameId() {
    return this.gameId;
  }

  addUser(user) {
    if (this.players.size >= config.game.maxPlayers) {
      throw new Error('Game is full');
    }

    const gameState = new PlayerGameData(user);
    this.players.set(user.userId, gameState);
    user.setCurrentGameId(this.gameId);

    // TODO: redis에 게임 상태 저장

    if (this.players.size >= config.game.maxPlayers) {
      this.startGame();
    }
  }

  // userId로 게임 세션에서 유저 검색
  getUserByUserId(userId) {
    return this.players.get(userId);
  }

  // userId로 게임 세션의 다른 유저 검색
  getOpponentUserByUserId(userId) {
    // Map에서 자신(userId)을 제외한 다른 유저를 반환
    for (const [key, value] of this.players.entries()) {
      if (key !== userId) {
        return value; // GameState 객체 반환
      }
    }
    return null; // 상대방이 없는 경우
  }

  removeUser(userId) {
    // userId에 해당하는 세션이 있으면 삭제하고 성공 여부 반환
    return this.players.delete(userId);
  }

  startGame() {
    this.isStarted = true;

    // TODO: 매치 완료 패킷 전송
  }
}

export default Game;
