import {
  GAME_START_REQUEST_REQUIRE,
  GAME_START_TIMEOUT,
  MAX_PLAYERS,
} from '../../constants/game.constants.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { recordGame } from '../../mysql/game/game.db.js';
import CustomErr from '../../utils/error/customErr.js';
import logger from '../../utils/log/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import CheckPointManager from '../managers/CheckPointManager.class.js';
import gameSessionManager from '../managers/gameSessionManager.js';
import MineralSyncManager from '../managers/mineralSyncManager.js';
import userSessionManager from '../managers/userSessionManager.js';
import { ERR_CODES } from './../../utils/error/errCodes.js';
import { handleErr } from './../../utils/error/handlerErr.js';
import PlayerGameData from './playerGameData.class.js';

class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.players = new Map();
    this.startRequestUsers = new Set();
    this.startRequestTimer = null;
    this.inProgress = false;
    this.checkPointManager = null;
    this.mineralSyncManager = new MineralSyncManager();
    this.unitIdCounter = 1;
    this.winTeam = null;
    this.checker = setTimeout(() => this.checkerFunc(), 5 * 1000);
  }

  checkerFunc() {
    clearTimeout(this.checker);
    if (!this.isInProgress()) {
      gameSessionManager.removeGameSession(this.gameId);
      console.log(`${this.gameId} 비정상 게임세션을 삭제합니다.`);
    }
  }

  getGameId() {
    return this.gameId;
  }

  generateUnitId() {
    return this.unitIdCounter++;
  }

  isInProgress() {
    return this.inProgress;
  }

  addUser(user) {
    try {
      if (!user) {
        throw new Error('User for addUser not found');
      }
      if (this.players.size >= MAX_PLAYERS) {
        throw new Error('Game is full');
      }

      const playerGameData = new PlayerGameData(user);
      this.players.set(user.userId, playerGameData);

      // 유저들의 gameStartRequest를 기다림
      if (this.players.size >= MAX_PLAYERS) {
        this.setupGameStartTimer();
      }
    } catch (err) {
      handleErr(null, err);
    }
  }

  // 유저들의 gameStartRequest를 기다림
  setupGameStartTimer() {
    // 게임 시작 타이머 (30초 대기)
    this.startRequestTimer = setTimeout(() => {
      this.checkGameStart();
    }, GAME_START_TIMEOUT);
  }

  checkGameStart() {
    // 타이머 만료 시 게임 취소
    if (this.startRequestUsers.size < GAME_START_REQUEST_REQUIRE) {
      // TODO: 게임 취소 패킷 추가
      this.cancelGame();
    }
  }

  async handleGameStartRequest(userId) {
    try {
      if (!this.players.has(userId)) return;

      this.startRequestUsers.add(userId);

      // 모든 플레이어가 게임 시작 요청을 보냈다면
      if (this.startRequestUsers.size >= GAME_START_REQUEST_REQUIRE) {
        this.startGame();
      }
    } catch (err) {
      handleErr(null, err);
    }
  }

  startGame() {
    try {
      // 게임이 이미 실행중이라면 리턴
      if (this.inProgress) {
        return;
      }

      logger.info(`start game users: ${[...this.startRequestUsers]}`);
      // 타이머 제거
      if (this.startRequestTimer) {
        clearTimeout(this.startRequestTimer);
      }

      this.inProgress = true;

      this.initGame();

      // 각 플레이어에게 게임 시작 알림
      // eslint-disable-next-line no-unused-vars
      for (const [userId, _] of this.players) {
        const user = userSessionManager.getUserByUserId(userId);
        if (user) {
          const species = user.getCurrentSpecies();
          sendPacket(user.getSocket(), PACKET_TYPE.GAME_START_NOTIFICATION, { species });
        }
      }
    } catch (err) {
      handleErr(null, err);
      this.cancelGame();
    }
  }

  initGame() {
    const playerData = [];
    // 체크포인트 매니저 생성 및 플레이어 게임 데이터 인자 추가
    for (const value of this.players.values()) {
      playerData.push(value);
    }

    this.checkPointManager = new CheckPointManager(playerData[0], playerData[1]);
    this.mineralSyncManager.startSyncLoop(this.players, this.checkPointManager);
  }

  cancelGame() {
    try {
      // eslint-disable-next-line no-unused-vars
      for (const [userId, _] of this.players) {
        const user = userSessionManager.getUserByUserId(userId);
        if (user) {
          const err = new CustomErr(ERR_CODES.GAME_CANCELED, '게임이 취소되었습니다.');
          handleErr(user.socket, err);

          user.setCurrentGameId(null);
        }
      }

      // 혹시나 실행됐던 매니저들 삭제
      this.cleanupGameResources();

      // 게임세션 삭제
      gameSessionManager.removeGameSession(this.gameId);
    } catch (err) {
      err.message = 'cancelGame error: ' + err.message;
      handleErr(null, err);
    }
  }

  endGame() {
    if (!this.inProgress) return;
    this.inProgress = false;

    try {
      this.cleanupGameResources();

      const players = Array.from(this.players.entries()); // Map을 배열로 변환

      if (players.length !== 2)
        throw new CustomErr(ERR_CODES.INVALID_GAME_STATE, '게임 세션 상태 오류');

      const [player0, player1] = players;
      this.winTeam = this.determineWinTeam(player0, player1);


      this.finalizeGameResult(players);

    } catch (err) {
      err.message = 'endGame error: ' + err.message;
      handleErr(null, err);
    }
  }

  determineWinTeam([player0Id, player0Data], [player1Id, player1Data]) {
    const p0BaseHp = player0Data.getBaseHp();
    const p1BaseHp = player1Data.getBaseHp();

    if (p0BaseHp === null || p1BaseHp === null )
      throw new CustomErr(ERR_CODES.INVALID_GAME_STATE, '게임 세션 데이터 정보 오류');

    if (p0BaseHp > p1BaseHp) return player0Id;
    if (p0BaseHp < p1BaseHp) return player1Id;
    return 'DRAW';
  }

  async endGameByDisconnect(userId) {
    if (!this.inProgress) return;
    this.inProgress = false;

    try {
      this.cleanupGameResources();

      const player = this.getOpponentGameDataByUserId(userId);
      if (!player) {
        throw new CustomErr(ERR_CODES.USER_NOT_FOUND, '상대방을 찾을 수 없습니다.');
      }

      this.winTeam = player.getUserId();

      // 상대방에게만 승리 패킷 전송
      sendPacket(player.getSocket(), PACKET_TYPE.GAME_OVER_NOTIFICATION, {
        isWin: true,
      });

      // 게임 기록만 남기고 보상 제외
      await recordGame(
        Array.from(this.players.keys())[0],
        Array.from(this.players.keys())[1],
        this.winTeam,
      );
    } catch (err) {
      err.message = 'endGameByDisconnect error: ' + err.message;
      handleErr(null, err);
    } finally {
      // 게임세션 삭제
      gameSessionManager.removeGameSession(this.gameId);
    }
  }

  // 실행됐던 인터벌, 매니저 등 삭제
  cleanupGameResources() {
    // 체크포인트 인터벌 중지
    const checkPointManager = this.getCheckPointManager();
    if (checkPointManager) {
      checkPointManager.delete();
    }
    this.checkPointManager = null;

    // 미네랄 싱크 인터벌 중지
    this.mineralSyncManager.stopSyncLoop();
  }

  async finalizeGameResult(players) {
    try {
      for (const [userId, userData] of players) {
        const isWin = this.winTeam === userId;

        // 유저에게 줄 보상이 생긴다면 여기에서..?

        // 패킷 전송
        sendPacket(userData.getSocket(), PACKET_TYPE.GAME_OVER_NOTIFICATION, {
          isWin,
        });
      }

      await recordGame(players[0][0], players[1][0], this.winTeam);
    } catch (err) {
      err.message = 'finalizeGameResult error: ' + err.message;
      handleErr(null, err);
    } finally {
      // 게임세션 삭제
      gameSessionManager.removeGameSession(this.gameId);
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

  getOpponentUserId(userId) {
    // Map에서 자신(userId)을 제외한 다른 유저를 반환
    for (const key of this.players.keys()) {
      if (key !== userId) {
        return key;
      }
    }
    return null; // 상대방이 없는 경우
  }

  removeUser(userId) {
    // userId에 해당하는 세션이 있으면 삭제하고 성공 여부 반환
    return this.players.delete(userId);
  }

  getCheckPointManager() {
    return this.checkPointManager;
  }
}

export default Game;
