import PacketManager from '../../classes/managers/packetManager.js';
import { createPacket } from '../response/createPacket.js';
import { addBanList } from '../util/blockIp.js';

const packetManager = new PacketManager();

export const sendPacket = (socket, type, payload = {}) => {
  if (!socket || !type) throw new Error('sendPacket 인자값 확인하세요.');
  const packet = createPacket(type, ++socket.sequence, payload);
  packetManager.enQueueSend(socket, packet);
};

export const recvPacket = (socket, packet) => {
  if (!socket || !packet) {
    socket.illegalCount++;
    if (socket.illegalCount >= 5) {
      addBanList(socket);
    }
    throw new Error('receivePacket 인자값 확인하세요.');
  }
  packetManager.enQueueRecv(socket, packet);
};
