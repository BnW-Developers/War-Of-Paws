import { parsePacket } from '../utils/parser/packetParser.js';
import { config } from '../config/config.js';
import { GamePacket, GlobalFailCode } from '../init/loadProto.js';
import CustomErr from '../utils/error/customErr.js';
import { getHandlers } from '../init/loadHandlers.js';
import { snakeToCamel } from './../utils/formatter/snakeToCamel.js';
import { PACKET_TYPE_REVERSED } from '../constants/header.js';

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
    // 패킷 파서에서 가져옴
    const { version, packetType, payload } = packet;

    if (version !== config.client.version) {
      throw new CustomErr(GlobalFailCode.INVALID_REQUEST, 'Check to version');
    }

    const payloadName = snakeToCamel(PACKET_TYPE_REVERSED[packetType]);
    const handlers = getHandlers();
    const handler = handlers[payloadName];
    const decodedPayload = { ...GamePacket.decode(payload)[payloadName] };
    handler(socket, decodedPayload);

    // handleIncomingPacket(socket, packet);
  } catch (err) {
    // TODO: 에러 핸들링을 어떻게 할 것인지 구상 필요 ( handleErr 재설계 )
  }
};
