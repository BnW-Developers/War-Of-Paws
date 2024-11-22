import { parsePacket } from '../utils/parser/packetParser.js';
import { config } from '../config/config.js';
import { handleErr } from './../utils/error/handlerErr.js';
import { recvPacket } from '../utils/packet/packetManager.js';

export const onData = (socket) => (data) => {
  // 기존 버퍼에 데이터 추가
  socket.buffer = Buffer.concat([socket.buffer, data]);

  try {
    // 패킷 타입 + 버전 길이
    const typeAndVersionLength = config.packet.typeLength + config.packet.versionLength;
    let packet;
    while (socket.buffer.length > 0) {
      if (socket.buffer.length >= typeAndVersionLength) {
        packet = parsePacket(socket);
        if (!packet) {
          break;
        }
      }
    }
    recvPacket(socket, packet);

    // 시퀀스 처리 부분 -> 이 부분은 추후에 UDP 전환 시 추가 고려
    // handleIncomingPacket(socket, packet);
  } catch (err) {
    handleErr(socket, err);
  }
};
