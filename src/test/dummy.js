import net from 'net';
import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PACKET_TYPE, PACKET_TYPE_REVERSED } from '../constants/header.js';
import { snakeToCamel } from '../utils/formatter/snakeToCamel.js';
import { MARK_1 } from './contents.js';
import { delay } from '../utils/util/delay.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DummyClient {
  constructor(id) {
    this.id = id; // 클라이언트 ID
    this.socket = new net.Socket();
    this.sequence = 0;
    this.buffer = Buffer.alloc(0);
    this.root = null;
    this.GamePacket = null;
    this.myUnit = [];
    this.oppoUnit = [];
  }

  async initialize() {
    // proto 파일 로드
    this.root = await protobuf.load(path.resolve(__dirname, '../protobuf/packet.proto'));
    this.GamePacket = this.root.lookupType('GamePacket');

    // 데이터 핸들러 설정
    this.socket.on('data', (data) => this.handleData(data));
  }

  connect(host, port) {
    return new Promise((resolve, reject) => {
      this.socket.connect(port, host, () => {
        console.log(`[클라이언트 ${this.id}] 서버에 연결됨`);
        resolve();
      });

      this.socket.on('error', (error) => {
        console.error(`[클라이언트 ${this.id}] 소켓 에러:`, error);
        reject(error);
      });
    });
  }

  createPacket(packetType, payload) {
    const message = this.GamePacket.create(payload);
    const encodedPayload = this.GamePacket.encode(message).finish();

    const versionStr = '1.0.0';
    const packetSize =
      2 + // 패킷 타입 (uint16)
      1 + // 버전 길이 (uint8)
      versionStr.length + // 버전 문자열
      4 + // 시퀀스 (uint32)
      2 + // 페이로드 길이 (uint16)
      encodedPayload.length;

    const buffer = Buffer.alloc(packetSize);
    let offset = 0;

    buffer.writeUInt16BE(packetType, offset);
    offset += 2;

    buffer.writeUInt8(versionStr.length, offset);
    offset += 1;

    buffer.write(versionStr, offset);
    offset += versionStr.length;

    buffer.writeUInt32BE(10, offset);
    offset += 4;

    buffer.writeUInt16BE(encodedPayload.length, offset);
    offset += 2;

    encodedPayload.copy(buffer, offset);

    return buffer;
  }

  parsePacket() {
    try {
      let offset = 0;

      if (this.buffer.length < offset + 2) return null;
      const packetType = this.buffer.readUInt16BE(offset);
      offset += 2;

      if (this.buffer.length < offset + 1) return null;
      const versionLength = this.buffer.readUInt8(offset);
      offset += 1;

      if (this.buffer.length < offset + versionLength) return null;
      const version = this.buffer.slice(offset, offset + versionLength).toString();
      offset += versionLength;

      if (this.buffer.length < offset + 4) return null;
      const sequence = this.buffer.readUInt32BE(offset);
      offset += 4;

      if (this.buffer.length < offset + 2) return null;
      const payloadLength = this.buffer.readUInt16BE(offset);
      offset += 2;

      if (this.buffer.length < offset + payloadLength) return null;
      const payload = this.buffer.slice(offset, offset + payloadLength);
      offset += payloadLength;

      this.buffer = this.buffer.slice(offset);

      return {
        packetType,
        version,
        sequence,
        payload,
      };
    } catch (err) {
      console.error(`[클라이언트 ${this.id}] 패킷 파싱 중 오류 발생:`, err);
    }
  }

  handleData(data) {
    this.buffer = Buffer.concat([this.buffer, data]);

    while (this.buffer.length >= 3) {
      const packet = this.parsePacket();
      if (!packet) break;

      this.handlePacket(packet);
    }
  }

  handlePacket(packet) {
    try {
      const decodedPayload = this.GamePacket.decode(packet.payload);
      const packetType = packet.packetType;
      if (packetType) {
        const packetName = PACKET_TYPE_REVERSED[packetType];
        console.log(packetName + ' 받았음!');
        const response = { ...decodedPayload[snakeToCamel(packetName)] };
        switch (packetType) {
          case PACKET_TYPE.SPAWN_UNIT_RESPONSE:
            this.myUnit.push({
              assetId: response.assetId,
              unitId: response.unitId,
              isTop: response.toTop,
            });
            console.log(this.myUnit);
            break;
          case PACKET_TYPE.SPAWN_ENEMY_UNIT_NOTIFICATION:
            this.oppoUnit.push({
              assetId: response.assetId,
              unitId: response.unitId,
              isTop: response.toTop,
            });
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error(`[클라이언트 ${this.id}] 패킷 처리 중 오류 발생:`, error);
    }
  }

  async playContents() {
    const contents = MARK_1;
    for (const content of contents) {
      const packetType = content.packetType;
      let payload = content.payload;

      switch (packetType) {
        case PACKET_TYPE.ENTER_CHECKPOINT_NOTIFICATION:
          console.log(this.myUnit[0]);
          payload = { isTop: this.myUnit[0].isTop, unitId: this.myUnit[0].unitId };
          break;

        case PACKET_TYPE.ATTACK_BASE_REQUEST:
          payload = { unitId: this.myUnit[0].unitId };
          break;

        default:
          break;
      }
      const encodedPayload = { [snakeToCamel(PACKET_TYPE_REVERSED[packetType])]: payload };
      const packet = this.createPacket(packetType, encodedPayload);
      console.log(encodedPayload);
      this.socket.write(packet);
      console.log(`${PACKET_TYPE_REVERSED[packetType]} 패킷을 전송하였습니다.`);
      await delay(content.duration);
    }
  }

  close() {
    this.socket.end();
    console.log(`[클라이언트 ${this.id}] 연결이 종료되었습니다`);
  }
}

async function simulateClients(clientCount, host, port) {
  const clients = [];

  for (let i = 1; i <= clientCount; i++) {
    const client = new DummyClient(i);

    try {
      await client.initialize();
      await client.connect(host, port);
      client.playContents();
      clients.push(client);
    } catch (error) {
      console.error(`[클라이언트 ${i}] 초기화 실패:`, error);
    }
  }

  return clients;
}

async function main() {
  const clientCount = 1;
  const host = '13.124.152.37';
  const port = 3000;

  const clients = await simulateClients(clientCount, host, port);

  setTimeout(async () => {
    clients.forEach((client) => client.close());
    console.log('모든 클라이언트 연결 종료');
  }, 100000); // 5초 후 종료
}

main();
