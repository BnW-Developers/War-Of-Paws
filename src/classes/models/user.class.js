import userSessionManager from '../managers/userSessionManager.js';

class User {
  constructor(socket, userId) {
    this.socket = socket;
    this.userId = userId;
    this.currentGameId = null; // 유저가 참가한 게임 세션 id
    this.currentSpecies = null;
    this.checker = setTimeout(() => this.checkerFunc(), 5 * 1000);
  }

  isConnected() {
    return this.socket === null ? false : true;
  }

  checkerFunc() {
    clearTimeout(this.checker);
    if (!this.isConnected()) {
      userSessionManager.removeUser(this.userId);
      console.log(`${this.userId} 유저가 연결되지 않아 세션에서 삭제합니다.`);
    }
  }

  getSocket() {
    return this.socket;
  }

  setSocket(socket) {
    this.socket = socket;
  }

  getUserId() {
    return this.userId;
  }

  getCurrentGameId() {
    return this.currentGameId;
  }

  setCurrentGameId(gameId) {
    this.currentGameId = gameId;
  }

  getCurrentSpecies() {
    return this.currentSpecies;
  }

  setCurrentSpecies(species) {
    this.currentSpecies = species;
  }
}

export default User;
