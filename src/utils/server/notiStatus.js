import { hashed } from '../auth/hashed.js';
import { config } from '../../config/config.js';
import gameSessionManager from '../../classes/managers/gameSessionManager.js';
import logger from '../logger.js';
import { getCpuUsage, getMemUsage } from './calcUsage.js';

let myIp = '';

const getMyIp = async () => {
  // var interfaces = os.networkInterfaces();
  // var result = '';

  // for (const dev in interfaces) {
  //   interfaces[dev].forEach(function (details) {
  //     if (details.family == 'IPv4' && details.internal === false) {
  //       myIp = details.address;
  //     }
  //   });
  // }
  const url = 'http://checkip.amazonaws.com/';
  const response = await fetch(url, {
    method: 'GET', // HTTP 메서드: GET
    headers: {
      'Content-Type': 'application/json', // JSON 데이터 전송
    },
  });
  myIp = (await response.text()).trim();
  logger.info(`[IP LOAD] - ${myIp}`);
};

export const notificationStatus = async () => {
  try {
    // 초기 IP 로드
    if (myIp === '') await getMyIp();
    // CPU 상태
    const cpuUsage = await getCpuUsage();
    // 메모리 상태
    const memUsage = getMemUsage();

    // 게임세션 카운트
    const sessionCnt = gameSessionManager.getGameSessionSize();

    // API 요청
    const url = 'http://10.178.0.11:13571/check/svrStatus';
    const key = await hashed(config.auth.api_key);
    const data = {
      ip: myIp,
      cpuUsage,
      memUsage,
      sessionCnt,
    };

    const response = await fetch(url, {
      method: 'POST', // HTTP 메서드: POST
      headers: {
        'Content-Type': 'application/json', // JSON 데이터 전송
        authorization: key,
      },
      body: JSON.stringify(data), // 데이터를 JSON 문자열로 변환하여 전송
    });

    if (!response.ok) {
      // TODO: 재전송 로직
    }

    logger.info(
      `[상태 보고] CPU 사용량 - ${cpuUsage} % / MEM 사용량 - ${memUsage} % / 세션 등록 수 - ${sessionCnt}`,
    );
  } catch (err) {
    logger.error(`게임서버 상태 보고 실패 - ${err.message}`);
  }
};
