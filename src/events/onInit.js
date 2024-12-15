import { handleErr } from './../utils/error/handlerErr.js';
import { onData } from './onData.js';

export const onInit = (socket) => (data) => {
  try {
    socket.buffer = Buffer.concat([socket.buffer, data]);

    // 프록시 프로토콜 헤더 초반과 끝 찾음
    const startIdx = socket.buffer.findIndex((byte) => byte === 'P'.charCodeAt(0));
    const endIdx = socket.buffer.findIndex((byte) => byte === '\n'.charCodeAt(0));

    // 충족될 시 아래 조건문 실행
    if (startIdx !== -1 && endIdx !== -1) {
      const proxyData = socket.buffer.slice(startIdx, endIdx + 1).toString();
      // 정규표현식을 통해 데이터 추출
      const match = proxyData.match(/^PROXY (\S+) (\S+) (\S+) (\d+) (\d+)/);
      if (match) {
        socket.userIp = match[2];
        socket.userPort = match[4];

        console.log(`${socket.userIp} : ${socket.userPort} - 접속됨`);

        // 헤더 처리 후 버퍼에서 해당 부분 제거
        socket.buffer = socket.buffer.slice(endIdx + 1);
      }

      // 초기화 작업 끝났으니 onData핸들러로 변경
      socket.on('data', onData(socket));

      // 남아있는 데이터가 있으면 새 핸들러로 전달
      if (socket.buffer.length > 0) {
        socket.emit('data', socket.buffer);
        socket.buffer = Buffer.alloc(0);
      }
    }
  } catch (err) {
    handleErr(socket, err);
  }
};
