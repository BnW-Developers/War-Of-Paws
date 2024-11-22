import { PACKET_TYPE_REVERSED } from '../../constants/header.js';
import { getHandlers } from '../../init/loadHandlers.js';
import { GamePacket } from '../../init/loadProto.js';
import { snakeToCamel } from '../formatter/snakeToCamel.js';

// 클라이언트 시퀀스 관리
const clientSequences = new Map();
// 클라이언트 시퀀스 대기열
const clientWaitingQueue = new Map();

export function handleIncomingPacket(socket, packet) {
  const currentSequence = packet.sequence;
  const lastSequence = clientSequences.get(socket.clientId) || 0;

  if (currentSequence === lastSequence + 1) {
    // 순서가 맞는 시퀀스일 때
    clientSequences.set(socket.clientId, currentSequence);
    processPacket(socket, packet);

    // 대기열에서 연속된 패킷 처리
    const queue = clientWaitingQueue.get(socket.clientId) || [];

    // 대기열에 넣을 때 정렬하기 때문에 0번 인덱스로 비교.
    while (queue.length > 0 && queue[0].sequence === clientSequences.get(socket.clientId) + 1) {
      const nextPacket = queue.shift();
      clientSequences.set(socket.clientId, nextPacket.sequence);
      processPacket(socket, nextPacket.packet);
    }
  } else if (currentSequence > lastSequence + 1) {
    // 순서가 맞지 않는 시퀀스일 때
    console.warn('패킷 누락');
    if (!clientWaitingQueue.has(socket.clientId)) clientWaitingQueue.set(socket.clientId, []);
    const queue = clientWaitingQueue.get(socket.clientId);

    if (!queue.some((q) => q.sequence === currentSequence)) {
      queue.push({ sequence: currentSequence, packet });
      queue.sort((a, b) => a.sequence - b.sequence); // 시퀀스 순서대로 정렬
      clientWaitingQueue.set(socket.clientId, queue);
    }
    requestMissingPacket(socket.clientId, lastSequence + 1);
  } else {
    // 이전 시퀀스와 같은 번호일 때
    console.log(`패킷 중복`);
  }
}

function requestMissingPacket() {
  console.log('재전송 요청');
  // TODO: 실제로 클라이언트에 재전송 요청을 보내는 로직을 구현필요
}

function processPacket(socket, packet) {
  const { packetType, payload } = packet;
  const payloadName = snakeToCamel(PACKET_TYPE_REVERSED[packetType]);
  const handlers = getHandlers();
  const handler = handlers[payloadName];
  const decodedPayload = { ...GamePacket.decode(payload)[payloadName] };
  handler(socket, decodedPayload);
}
