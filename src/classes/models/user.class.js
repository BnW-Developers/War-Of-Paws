class User {
  constructor(socket, userId) {
    this.socket = socket;
    this.userId = userId;
    this.currentGameId = null; // 유저가 참가한 게임 세션 id
    this.currentSpecies = null;
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

  setCurrentSpecies(speices) {
    this.currentSpecies = speices;
  }
}

export default User;
