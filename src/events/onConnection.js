import { requestIpBan } from '../utils/server/requestIpBan.js';
import { onEnd } from './onEnd.js';
import { onError } from './onError.js';
import { onInit } from './onInit.js';

export const onConnection = (socket) => {
  try {
    // 초기 소켓 설정
    socket.setNoDelay = true;
    socket.buffer = Buffer.alloc(0);
    socket.sequence = 0;
    socket.isAuthenticated = false; // 인증 상태 플래그 추가

    // 일정 시간 내에 인증 완료되지 않으면 연결 종료
    socket.authTimeout = setTimeout(async () => {
      if (!socket.isAuthenticated) {
        if (socket.userIp) {
          console.log(`인증 시간 초과: ${socket.userIp}`);
          // 인증을 못했다는 것은 비정상 루트로 들어왔다는 내용이기에 차단
          await requestIpBan(socket.userIp, 'Authentication failed');
        }
        socket.end();
        socket.destroy();
      }
    }, 10 * 1000); // 10초 타임아웃

    socket.once('data', onInit(socket));
    socket.on('end', onEnd(socket));
    socket.on('error', onError(socket));
  } catch (err) {
    console.error('onConnection 오류', err);
    socket.end();
  }
};
