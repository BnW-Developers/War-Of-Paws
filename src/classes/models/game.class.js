import PlayerGameData from './playerGameData.class.js';
import { GAME_CONSTANTS } from '../../constants/game.constants.js';
import CustomErr from '../../utils/error/customErr.js';
import { errCodes } from './../../utils/error/errCodes';

class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.players = new Map();
    this.inProgress = false;
    this.checkPointManager = null;
  }

  getGameId() {
    return this.gameId;
  }

  getPlayerGameData(userId) {
    return this.players.get(userId);
  }

  isInProgress() {
    return this.inProgress;
  }

  addUser(user) {
    if (this.players.size >= GAME_CONSTANTS.MAX_PLAYERS) {
      throw new Error('Game is full');
    }

    const playerGameData = new PlayerGameData(user);
    this.players.set(user.userId, playerGameData);
    user.setCurrentGameId(this.gameId);

    // TODO: redis에 게임 상태 저장

    if (this.players.size >= GAME_CONSTANTS.MAX_PLAYERS) {
      this.startGame();
    }
  }

  // userId로 게임 세션에서 유저 검색
  getPlayerGameDataByUserId(userId) {
    return this.players.get(userId);
  }

  // userId로 게임 세션의 다른 유저 검색
  getOpponentGameDataByUserId(userId) {
    // Map에서 자신(userId)을 제외한 다른 유저를 반환
    for (const [key, value] of this.players.entries()) {
      if (key !== userId) {
        return value; // PlayerGameData 객체 반환
      }
    }
    return null; // 상대방이 없는 경우
  }

  getAllPlayerGameDataBySocket(socket) {
    // 플레이어가 2명이 아니면 null 반환
    if (this.players.size !== 2)
      throw new CustomErr(errCodes.USER_NOT_FOUND, '게임 세션 내 유저가 2명이 아닙니다.');

    let player = undefined;
    let opponent = undefined;

    for (const [_, value] of this.players.entries()) {
      if (value.socket === socket) {
        player = value;
      } else {
        opponent = value;
      }
    }

    // 두 플레이어가 모두 확인되었을 때 반환
    return player && opponent ? { player, opponent } : null;
  }

  removeUser(userId) {
    // userId에 해당하는 세션이 있으면 삭제하고 성공 여부 반환
    return this.players.delete(userId);
  }

  getCheckPointManager() {
    return this.checkPointManager;
  }

  startGame() {
    this.inProgress = true;

    // 체크포인트 매니저 생성
    const player = [...this.players.values()];
    this.checkPointManager = new CheckPointManager(player[0], player[1]);
    // TODO: 매치 완료 패킷 전송
  }
}

export default Game;
