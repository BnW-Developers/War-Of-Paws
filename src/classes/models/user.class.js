class User {
  constructor(socket, userId, playerGameData = null) {
    this.socket = socket;
    this.userId = userId;
    this.sequence = 0;
    this.currentGameId = null; // 유저가 참가한 게임 세션 id
    this.playerGameData = playerGameData;
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

  setplayerGameData(playerGameData) {
    this.playerGameData = playerGameData;
  }

  getplayerGameData() {
    return this.playerGameData;
  }
}

export default User;
