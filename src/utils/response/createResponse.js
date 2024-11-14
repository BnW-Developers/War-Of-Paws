import { config } from '../../config/config.js';
import { PACKET_TYPE_REVERSED } from '../../constants/header.js';
import { GamePacket } from '../../init/loadProto.js';
import { snakeToCamel } from './../formatter/snakeToCamel.js';

// TODO: 시퀀스 서버 to 클라이언트 관리할 지 결정 후 변경 필요

export const createResponse = (Type, seq, data = null, err = null) => {
  const typeName = PACKET_TYPE_REVERSED[Type];
  const camel = snakeToCamel(typeName);

  const response = {
    [camel]: data,
  };

  const payload = GamePacket.encode(response).finish();

  const packetType = Buffer.alloc(config.packet.typeLength);
  packetType.writeUInt16BE(Type, 0);

  const versionLength = Buffer.alloc(config.packet.versionLength);
  const vLen = config.client.version.length;
  versionLength.writeUInt8(vLen, 0);

  const version = Buffer.alloc(vLen);
  Buffer.from(config.client.version).copy(version);

  const sequence = Buffer.alloc(config.packet.sequence);
  sequence.writeUInt32BE(seq++, 0); // 현재는 시퀀스 관리 없이 증가

  const errorCode = Buffer.alloc(config.packet.errorCode);
  errorCode.writeUInt8(err || 0, 0);

  const payloadLength = Buffer.alloc(config.packet.payloadLength);
  payloadLength.writeUInt32BE(payload.length, 0);

  return Buffer.concat([
    packetType,
    versionLength,
    version,
    sequence,
    errorCode,
    payloadLength,
    payload,
  ]);
};
