import logger from '../utils/logger.js';
import { onData } from './onData.js';
import { onEnd } from './onEnd.js';
import { onError } from './onError.js';
import { v4 as uuidV4 } from 'uuid';

export const onConnection = (socket) => {
  try {
    const port = socket.remotePort;
    logger.info(`${port} - 포트로 연결시도 `);
    // 초기 소켓 설정
    socket.setNoDelay = true;
    socket.buffer = Buffer.alloc(0);
    socket.sequence = 0;
    socket.isAuthenticated = false; // 인증 상태 플래그 추가

    // 일정 시간 내에 인증 완료되지 않으면 연결 종료
    socket.authTimeout = setTimeout(() => {
      if (!socket.isAuthenticated) {
        console.log(`인증 시간 초과: ${port}`);
        socket.end();
      }
    }, 10 * 1000); // 10초 타임아웃

    socket.on('data', onData(socket));
    socket.on('end', onEnd(socket));
    socket.on('error', onError(socket));
  } catch (err) {
    console.error('onConnection 오류', err);
    socket.end();
  }
};
