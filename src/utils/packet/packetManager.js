import PacketManager from '../../classes/managers/packetManager.js';

const packetManager = new PacketManager();

export const sendPacket = (socket, packet) => {
  if (!socket || !packet) throw new Error('sendPacket 인자값 확인하세요.');
  packetManager.enQueueSend(socket, packet);
};

export const recvPacket = (socket, packet) => {
  if (!socket || !packet) throw new Error('receivePacket 인자값 확인하세요.');
  packetManager.enQueueRecv(socket, packet);
};
