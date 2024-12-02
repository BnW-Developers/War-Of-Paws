import gameSessionManager from '../classes/managers/gameSessionManager.js';
import userSessionManager from '../classes/managers/userSessionManager.js';
import { PACKET_TYPE } from '../constants/header.js';
import redisClient from '../redis/redisClient.js';
import { ERR_CODES } from '../utils/error/errCodes.js';
import { handleErr } from '../utils/error/handlerErr.js';
import logger from '../utils/logger.js';
import { sendPacket } from '../utils/packet/packetManager.js';

class MatchingSystem {
  constructor() {
    if (MatchingSystem.instance) {
      return MatchingSystem.instance;
    }

    this.redis = redisClient;

    // 매칭 관련 상수
    this.CAT_QUEUE_KEY = 'matching:queue:cat';
    this.DOG_QUEUE_KEY = 'matching:queue:dog';
    this.LOCK_KEY = 'matching:lock';
    this.LOCK_TTL = 3 * 1000; // 3초
    this.MAX_WAIT_TIME = 5 * 60 * 1000; // 5분
    this.MATCH_INTERVAL = 500; // 500ms마다 매치 시도

    this.matchingLoop();

    MatchingSystem.instance = this;
  }

  // Redis 분산 락 시도
  async acquireLock() {
    const lockValue = Date.now().toString();
    const result = await this.redis.set(this.LOCK_KEY, lockValue, 'PX', this.LOCK_TTL, 'NX');
    if (result === 'OK') {
      return lockValue;
    }
    return null;
  }

  // 분산 락 해제
  async releaseLock(lockValue) {
    const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
    `;

    await this.redis.eval(script, 1, this.LOCK_KEY, lockValue);
  }

  // 시간마다 매칭 시도
  async matchingLoop() {
    const processMatches = async () => {
      let lockValue = null;
      try {
        // 락 획득 시도
        lockValue = await this.acquireLock();
        if (!lockValue) {
          // 다른 서버가 현재 매칭 처리 중
          return;
        }
        // CAT 팀과 DOG 팀의 각각의 대기열에서 유저 검색
        const allUsers = await this.getAllQueues();

        // 타임아웃 체크 및 처리
        await this.checkTimeouts(allUsers);

        // 매칭 시도
        await this.tryMatch(allUsers);
      } catch (err) {
        err.message = 'matchingLoop Error: ' + err.message;
        handleErr(null, err);
      } finally {
        if (lockValue) {
          await this.releaseLock(lockValue);
        }
      }
    };
    this.matchingIntervalId = setInterval(processMatches, this.MATCH_INTERVAL);
  }

  // 모든 종족의 대기얼 졍보 불러오기
  async getAllQueues() {
    try {
      const queues = {};
      const catQueue = await this.redis.zrange(this.CAT_QUEUE_KEY, 0, 9, 'WITHSCORES');
      const catUsers = this.parseQueueData(catQueue);
      queues['CAT'] = catUsers;

      const dogQueue = await this.redis.zrange(this.DOG_QUEUE_KEY, 0, 9, 'WITHSCORES');
      const dogUsers = this.parseQueueData(dogQueue);
      queues['DOG'] = dogUsers;

      return queues;
    } catch (err) {
      err.message = 'getAllQueues Error: ' + err.message;
      handleErr(null, err);
    }
  }

  parseQueueData(queue) {
    const parsed = [];
    for (let i = 0; i < queue.length; i += 2) {
      parsed.push({
        userId: queue[i],
        timestamp: Number(queue[i + 1]),
      });
    }
    return parsed;
  }

  async checkTimeouts(queues) {
    const filteredQueue = {};
    const now = Date.now();

    for (const [species, users] of Object.entries(queues)) {
      filteredQueue[species] = [];
      for (const user of users) {
        if (now - user.timestamp < this.MAX_WAIT_TIME) {
          // 타임아웃 되지 않은 유저는 새로운 큐에 삽입
          filteredQueue[species].push(user);
          continue;
        }
        // 타임아웃 처리
        await this.handleMatchTimeout(user.userId, species);
      }
    }

    return filteredQueue;
  }

  // 매칭 시간 처리 핸들러
  async handleMatchTimeout(userId, species) {
    try {
      logger.info(`match timeout id: ${userId}`);
      await this.removeUser(userId, species);

      const user = userSessionManager.getUserByUserId(userId);
      if (user) {
        // TODO: 매치 실패 notification?
        sendPacket(user.socket, PACKET_TYPE.ERROR_NOTIFICATION, {
          errorCode: ERR_CODES.MATCH_TIMEOUT,
          errorMessage: '매칭 시간 초과',
        });
        user.setIsMatchmaking(false);
      }
    } catch (err) {
      err.message = 'handleMatchTimeout Error: ' + err.message;
      handleErr(null, err);
    }
  }

  async tryMatch(allUsers) {
    const catUsers = allUsers['CAT'];
    const dogUsers = allUsers['DOG'];

    const minLength = Math.min(catUsers.length, dogUsers.length);

    if (minLength === 0) return;

    // 트랜잭션 시작
    const multi = this.redis.multi();

    for (let i = 0; i < minLength; i++) {
      const catUser = catUsers[i];
      const dogUser = dogUsers[i];

      // 매칭 큐에서 유저 제거 명령 트랜잭션에 추가
      multi.zrem(this.CAT_QUEUE_KEY, catUser.userId);
      multi.zrem(this.DOG_QUEUE_KEY, dogUser.userId);
    }

    // 트랜잭션 실행
    const results = await multi.exec();
    console.log('results: ', results);

    // 트랜잭션 성공한 매치에 대해서만 처리
    for (let i = 0; i < minLength; i++) {
      const catRemoved = results[i * 2][1];
      const dogRemoved = results[i * 2 + 1][1];

      if (catRemoved && dogRemoved) {
        const catUser = catUsers[i];
        const dogUser = dogUsers[i];
        this.handleMatchComplete(catUser.userId, dogUser.userId);
      }
    }
  }

  handleMatchComplete(user1Id, user2Id) {
    // 유저 id로 유저 인스턴스 불러오기
    const user1 = userSessionManager.getUserByUserId(user1Id);
    const user2 = userSessionManager.getUserByUserId(user2Id);

    if (!user1 || !user2) {
      throw new Error('매칭된 유저를 찾을 수 없습니다.');
    }

    // 게임 세션 생성
    const gameSession = gameSessionManager.addGameSession();
    if (!gameSession) {
      throw new Error('게임 생성에 실패했습니다.');
    }
    gameSession.addUser(user1);
    gameSession.addUser(user2);

    logger.info(`Match complete user1: ${user1Id} vs user2: ${user2Id}`);
    // 유저에게 매칭 결과 전송
    this.matchNotification(user1, user2);
  }

  matchNotification(user1, user2) {
    sendPacket(user1.getSocket(), PACKET_TYPE.MATCH_NOTIFICATION, {
      opponentId: user2.getUserId(),
      //opponentspecies: species2,
    });
    sendPacket(user2.getSocket(), PACKET_TYPE.MATCH_NOTIFICATION, {
      opponentId: user1.getUserId(),
      //opponentspecies: species1,
    });
  }

  // 종족에 맞는 매칭 큐에 유저 등록
  async addQueue(user, species) {
    try {
      // 유저 매치매이킹 상태 업데이트 (true)
      user.setIsMatchmaking(true);
      user.setCurrentSpecies(species.toUpperCase());

      const userId = user.getUserId();
      // 종족에 따른 queueKey 결정
      const queueKey = species.toUpperCase() === 'CAT' ? this.CAT_QUEUE_KEY : this.DOG_QUEUE_KEY;
      const timestamp = Date.now();
      // sorted set에 유저 저장. score: timestamp, value: userId
      await this.redis.zadd(queueKey, timestamp, userId);
      return { success: true, message: 'Added to queue' };
    } catch (err) {
      err.message = 'addQueue Error: ' + err.message;
      handleErr(null, err);
    }
  }

  // 매칭 큐에서 유저 삭제
  async removeUser(userId, species) {
    try {
      logger.info(`Remove user in matching queue id: ${userId}, species: ${species}`);
      // 유저 매치매이킹 상태 업데이트 (false)
      const user = userSessionManager.getUserByUserId(userId);
      user.setIsMatchmaking(false);

      const queueKey = species === 'CAT' ? this.CAT_QUEUE_KEY : this.DOG_QUEUE_KEY;
      await this.redis.zrem(queueKey, userId);
    } catch (err) {
      err.message = 'removeUser Error: ' + err.message;
      handleErr(null, err);
    }
  }
}

const matchingSystem = new MatchingSystem();
export default matchingSystem;
