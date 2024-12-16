import PacketManager from '../../classes/managers/packetManager.js';
import { PACKET_TYPE_REVERSED } from '../../constants/header.js';
import { snakeToCamel } from '../formatter/snakeToCamel.js';
import { createPacket } from '../response/createPacket.js';
import { requestIpBan } from '../server/requestIpBan.js';

const packetManager = new PacketManager();

export const sendPacket = (socket, type, payload = {}) => {
  if (!socket || !type) throw new Error('sendPacket 인자값 확인하세요.');

  const payloadName = snakeToCamel(PACKET_TYPE_REVERSED[type]);
  packetManager.nullCheckPayload(payload, payloadName);

  const packet = createPacket(type, ++socket.sequence, payload);
  packetManager.enQueueSend(socket, packet);
};

export const recvPacket = (socket, packet) => {
  if (!packet) {
    requestIpBan(socket.userIp, 'Transmission of non-compliant packets');
    if (socket.authTimeout) clearTimeout(socket.authTimeout);
    socket.end();
    socket.destroy();
    throw new Error('receivePacket 인자값 확인하세요.');
  }
  packetManager.enQueueRecv(socket, packet);
};
