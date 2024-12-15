import axios from 'axios';
import readline from 'readline';
import { DummyClient } from './dummyClient.js';
import { MARK_1, MARK_2 } from './contents.js';

class DummyTest {
  constructor() {
    this.host = 'ddori.site';
    this.loginPort = 5555;
    this.lobbyPort = 5959;
    this.token = null;
    this.matchPort = null;
    this.client = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async selectContent() {
    return new Promise((resolve) => {
      this.rl.question('콘텐츠를 선택하세요 (1: MARK_1, 2: MARK_2): ', (answer) => {
        switch (answer.trim()) {
          case '1':
            this.content = MARK_1;
            break;
          case '2':
            this.content = MARK_2;
            break;
          default:
            console.log('기본값 MARK_1을 사용합니다.');
            this.content = MARK_1;
        }
        resolve();
      });
    });
  }

  async login() {
    const attemptLogin = async () => {
      return new Promise((resolve, reject) => {
        this.rl.question('아이디를 입력하세요: ', (id) => {
          this.rl.question('비밀번호를 입력하세요: ', async (password) => {
            try {
              const response = await axios.post(`https://${this.host}:${this.loginPort}/login`, {
                id: id,
                password: password,
              });

              this.token = response.data.token;
              console.log('로그인 성공. 토큰 획득.');
              resolve(this.token);
            } catch (error) {
              console.error('로그인 실패:', error.response ? error.response.data : error.message);

              // Ask if user wants to try again
              this.rl.question('다시 로그인 하시겠습니까? (y/n): ', (answer) => {
                if (answer.toLowerCase() === 'y') {
                  // Recursive call to attempt login again
                  attemptLogin().then(resolve).catch(reject);
                } else {
                  // User chooses to stop trying
                  reject(error);
                }
              });
            }
          });
        });
      });
    };

    return attemptLogin();
  }

  async connectToMatchServer() {
    this.client = new DummyClient();

    try {
      await this.client.initialize();
      await this.client.connect(this.host, this.lobbyPort);

      // Send init packet with token
      this.client.sendInitPacket(this.token);

      // Wait for species selection
      this.chooseSpecies();
    } catch (error) {
      console.error('매칭 서버 연결 실패:', error);
    }
  }

  chooseSpecies() {
    this.rl.question('동물 종류를 선택하세요 (1: 고양이, 2: 개): ', (answer) => {
      const species = answer === '1' ? 'cat' : 'dog';
      console.log(`선택된 동물: ${species}`);

      this.client.sendMatchRequest(species);

      // match notification 처리
      this.client.socket.on('data', (data) => {
        this.handleMatchNotification(data);
      });
    });
  }

  handleMatchNotification(data) {
    try {
      this.client.handleData(data);

      const lastPacket = this.client.lastReceivedPacket;
      if (lastPacket && lastPacket.matchNotification) {
        this.matchPort = lastPacket.matchNotification.port;
        const opponent = lastPacket.matchNotification.opponentId;
        console.log(`매칭 성공! 상대: ${opponent} 대전 포트: ${this.matchPort}`);

        // 현재 연결 해제
        this.client.close();

        // 게임 서버로 연결
        this.connectToGameServer();
      }
    } catch (error) {
      console.error('매칭 알림 처리 중 오류:', error);
    }
  }

  async connectToGameServer() {
    const gameClient = new DummyClient(this.content);
    try {
      await gameClient.initialize();
      await gameClient.connect(this.host, this.matchPort);
      // init 패킷 바로 전송
      gameClient.sendInitPacket(this.token);

      setTimeout(() => {
        gameClient.sendGameStartRequest();
      }, 1000);

      setTimeout(() => {
        gameClient.playContents();
      }, 2000);
    } catch (error) {
      console.error('게임 서버 연결 실패:', error);
      this.rl.close();
    }
  }

  async start() {
    try {
      await this.selectContent();
      await this.login();
      await this.connectToMatchServer();
    } catch (error) {
      console.error('테스트 실패:', error);
      this.rl.close();
    }
  }
}

const dummyTest = new DummyTest();
dummyTest.start();
