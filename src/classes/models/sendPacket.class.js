import logger from '../../utils/logger.js';

class SendPacket {
  constructor() {
    if (SendPacket.instance instanceof SendPacket) return SendPacket.instance;
    SendPacket.instance = this;
    this.queue = [];
    this.isSending = false;
  }

  enQueue(socket, packet) {
    this.queue.push({ socket, packet });
    this.processQueue();
  }

  async processQueue() {
    if (this.isSending || !this.queue.length) return;
    this.isSending = true;

    while (this.queue.length) {
      const { socket, packet } = this.queue.shift();
      try {
        await this.sendPacket(socket, packet);
      } catch (err) {
        logger.error('Error sending packet:', err);
      }
    }

    this.isSending = false;
  }

  sendPacket(socket, packet) {
    return new Promise((resolve, reject) => {
      socket.write(packet, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export default SendPacket;
