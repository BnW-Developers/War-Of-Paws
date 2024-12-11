import {
  GAME_START_REQUEST_REQUIRE,
  GAME_START_TIMEOUT,
  MAX_PLAYERS,
} from '../../constants/game.constants.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import logger from '../../utils/log/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import CheckPointManager from '../managers/CheckPointManager.class.js';
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
  }

  getGameId() {
    return this.gameId;
  }

  generateUnitId() {
    return this.unitIdCounter++;
  }

  getPlayerGameData(userId) {
    return this.players.get(userId);
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
      this.endGameProcess();
    } catch (err) {
      err.message = 'cancelGame error: ' + err.message;
      handleErr(null, err);
    }
  }

  async endGame() {
    if (!this.inProgress) return;
    this.inProgress = false;

    let catUserId = null;
    let dogUserId = null;
    let winTeam = 'DRAW'; // 기본값 설정

    try {
      this.endGameProcess();

      const players = Array.from(this.players.entries()); // Map을 배열로 변환

      if (players.length >= 2) {
        // 첫 번째 유저
        const [firstUserId, firstUserData] = players[0];
        catUserId = firstUserId;
        const catBaseHp = firstUserData.baseHp;
        const catUser = userSessionManager.getUserByUserId(catUserId);

        // 두 번째 유저
        const [secondUserId, secondUserData] = players[1];
        dogUserId = secondUserId;
        const dogBaseHp = secondUserData.baseHp;
        const dogUser = userSessionManager.getUserByUserId(dogUserId);

        // baseHp 비교
        if (catBaseHp > dogBaseHp) {
          winTeam = 'CAT';
        } else if (catBaseHp < dogBaseHp) {
          winTeam = 'DOG';
        }

        // 유저들에게 게임 종료 알림 전송
        if (catUser) {
          catUser.setCurrentGameId(null);
          sendPacket(catUser.getSocket(), PACKET_TYPE.GAME_OVER_NOTIFICATION, {
            isWin: winTeam === 'CAT',
          });
        }

        if (dogUser) {
          dogUser.setCurrentGameId(null);
          sendPacket(dogUser.getSocket(), PACKET_TYPE.GAME_OVER_NOTIFICATION, {
            isWin: winTeam === 'DOG',
          });
        }
      }
    } catch (err) {
      err.message = 'endGame error: ' + err.message;
      handleErr(null, err);
    }
  }

  endGameByDisconnect(userId) {
    if (!this.inProgress) return;
    this.inProgress = false;

    let catUserId = null;
    let dogUserId = null;
    let winTeam = null;

    try {
      this.endGameProcess();

      const players = Array.from(this.players.entries());

      if (players.length >= 2) {
        // 첫 번째 플레이어의 정보 확인
        // eslint-disable-next-line no-unused-vars
        const [firstUserId, firstPlayerData] = players[0];
        catUserId = firstUserId;
        // 두 번째 플레이어의 정보 확인
        // eslint-disable-next-line no-unused-vars
        const [secondUserId, secondPlayerData] = players[1];
        dogUserId = secondUserId;

        // 접속 종료한 유저의 상대가 승리
        const winUserId = catUserId === userId ? dogUserId : catUserId;
        winTeam = catUserId === userId ? 'DOG' : 'CAT';

        // 남은 유저에게만 게임 종료 알림 전송
        const winUser = userSessionManager.getUserByUserId(winUserId);
        if (winUser) {
          winUser.setCurrentGameId(null);
          sendPacket(winUser.getSocket(), PACKET_TYPE.GAME_OVER_NOTIFICATION, {
            isWin: true,
          });
        }
      }
    } catch (err) {
      err.message = 'endGameByDisconnect error: ' + err.message;
      handleErr(null, err);
    }
  }

  // 실행됐던 인터벌, 매니저 등 삭제
  endGameProcess() {
    // 체크포인트 인터벌 중지
    const checkPointManager = this.getCheckPointManager();
    if (checkPointManager) {
      checkPointManager.delete();
    }
    this.checkPointManager = null;

    // 미네랄 싱크 인터벌 중지
    this.mineralSyncManager.stopSyncLoop();
  }

  // userId로 게임 세션에서 유저 검색
  getPlayerGameDataByUserId(userId) {
    return this.players.get(userId);
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

  removeUser(userId) {
    // userId에 해당하는 세션이 있으면 삭제하고 성공 여부 반환
    return this.players.delete(userId);
  }

  getCheckPointManager() {
    return this.checkPointManager;
  }
}

export default Game;
