import { Mutex } from 'async-mutex';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { snakeToCamel } from '../../utils/formatter/snakeToCamel.js';
import { PACKET_TYPE_REVERSED } from '../../constants/header.js';
import { getHandlers } from '../../init/loadHandlers.js';
import { config } from '../../config/config.js';
import { GamePacket } from '../../init/loadProto.js';
import { handleErr } from '../../utils/error/handlerErr.js';

class PacketManager {
  constructor() {
    if (PacketManager.instance instanceof PacketManager) return PacketManager.instance;
    PacketManager.instance = this;
    this.sendQueue = [];
    this.recvQueue = [];
    this.sendLock = new Mutex();
    this.recvLock = new Mutex();
    this.sendProcessing = false;
    this.recvProcessing = false;
  }

  async enQueueSend(socket, packet) {
    await this.sendLock.runExclusive(() => {
      this.sendQueue.push({ socket, packet });
      this.processSendPacket();
    });
  }

  async enQueueRecv(socket, packet) {
    await this.recvLock.runExclusive(() => {
      this.recvQueue.push({ socket, packet });
      this.processRecvPacket();
    });
  }

  async deQueueSend() {
    return await this.sendLock.runExclusive(() => {
      return this.sendQueue.shift();
    });
  }

  async deQueueRecv() {
    return await this.recvLock.runExclusive(() => {
      return this.recvQueue.shift();
    });
  }

  async processSendPacket() {
    if (!this.sendQueue.length || this.sendProcessing) return;
    this.sendProcessing = true;
    try {
      while (this.sendQueue.length) {
        const { socket, packet } = await this.deQueueSend();
        if (!socket || !packet) throw new Error('패킷 보내기 오류');
        await socket.write(packet);
      }
    } catch (err) {
      handleErr(null, err);
    } finally {
      this.sendProcessing = false;
    }
  }

  async processRecvPacket() {
    try {
      if (!this.recvQueue.length || this.recvProcessing) return;
      this.recvProcessing = true;
      while (this.recvQueue.length) {
        const { socket, packet } = await this.deQueueRecv();
        if (!socket || !packet) throw new Error('패킷 보내기 오류');

        const { version, packetType, payload } = packet;

        if (version !== config.client.version) {
          throw new CustomErr(ERR_CODES.CLIENT_VERSION_MISMATCH, 'Check to version', socket);
        }
        if (!PACKET_TYPE_REVERSED[packetType]) {
          throw new CustomErr(ERR_CODES.UNKNOWN_PACKET_TYPE, 'Unknown packet type', socket);
        }
        if (!payload || !GamePacket.decode(payload)) {
          throw new CustomErr(ERR_CODES.PACKET_DECODE_ERR, 'Packet decode error', socket);
        }

        const payloadName = snakeToCamel(PACKET_TYPE_REVERSED[packetType]);
        const handlers = getHandlers();
        const handler = handlers[payloadName];

        if (!handler) {
          throw new CustomErr(ERR_CODES.HANDLER_NOT_FOUND, 'Handler not found', socket);
        }

        const decodedPayload = { ...GamePacket.decode(payload)[payloadName] };
        handler(socket, decodedPayload);
      }
    } catch (err) {
      handleErr(err.socket, err);
    } finally {
      this.recvProcessing = false;
    }
  }
}

export default PacketManager;
