class User {
  constructor(socket, userId) {
    this.socket = socket;
    this.userId = userId;
    this.sequence = 0;
    this.currentGameId = null; // 유저가 참가한 게임 세션 id
    this.isMatchmaking = false;
  }

  getSocket() {
    return this.socket;
  }

  getUserId() {
    return this.userId;
  }

  getNextSequence() {
    return ++this.sequence;
  }

  getCurrentGameId() {
    return this.currentGameId;
  }

  setCurrentGameId(gameId) {
    this.currentGameId = gameId;
  }

  getIsMatchmaking() {
    return this.isMatchmaking;
  }

  setIsMatchmaking(isMatchmaking) {
    this.isMatchmaking = isMatchmaking;
  }
}

export default User;
