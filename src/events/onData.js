import { parsePacket } from '../utils/parser/packetParser.js';
import { config } from '../config/config.js';
import { GamePacket } from '../init/loadProto.js';
import CustomErr from '../utils/error/customErr.js';
import { getHandlers } from '../init/loadHandlers.js';
import { snakeToCamel } from './../utils/formatter/snakeToCamel.js';
import { PACKET_TYPE_REVERSED } from '../constants/header.js';
import { ERR_CODES } from '../utils/error/errCodes.js';
import { handleErr } from './../utils/error/handlerErr.js';

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
      throw new CustomErr(ERR_CODES.CLIENT_VERSION_MISMATCH, 'Check to version');
    }
    if (!PACKET_TYPE_REVERSED[packetType]) {
      throw new CustomErr(ERR_CODES.UNKNOWN_PACKET_TYPE, 'Unknown packet type');
    }
    if (!payload || !GamePacket.decode(payload)) {
      throw new CustomErr(ERR_CODES.PACKET_DECODE_ERR, 'Packet decode error');
    }

    const payloadName = snakeToCamel(PACKET_TYPE_REVERSED[packetType]);
    const handlers = getHandlers();
    const handler = handlers[payloadName];

    if (!handler) {
      throw new CustomErr(ERR_CODES.HANDLER_NOT_FOUND, 'Handler not found');
    }

    const decodedPayload = { ...GamePacket.decode(payload)[payloadName] };
    handler(socket, decodedPayload);

    // 시퀀스 처리 부분 -> 이 부분은 추후에 UDP 전환 시 추가 고려
    // handleIncomingPacket(socket, packet);
  } catch (err) {
    handleErr(socket, err);
  }
};
