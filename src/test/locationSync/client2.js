import net from 'net';
import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LOCATION_SYNC_TEST_2 } from './contents.js';
import { PACKET_TYPE, PACKET_TYPE_REVERSED } from '../../constants/header.js';
import { delay } from '../../utils/util/delay.js';
import { snakeToCamel } from '../../utils/formatter/snakeToCamel.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import { ASSET_TYPE, DIRECTION } from '../../constants/assets.js';
import Unit from '../../classes/models/unit.class.js';
import calcDist from '../../utils/location/calcDist.js';
import { loadGameAssets } from '../../init/loadAssets.js';
import logger from '../../utils/logger.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const moveInterval = 50;
const locationPacketSendInterval = 200; // ms

class DummyClient {
  constructor(id) {
    this.id = id; // 클라이언트 ID
    this.socket = new net.Socket();
    this.sequence = 0;
    this.buffer = Buffer.alloc(0);
    this.root = null;
    this.GamePacket = null;
    this.myUnits = [];
    this.opponentUnits = [];
    this.myUnitMap = new Map();
    this.opponentUnitMap = new Map();
  }

  addMyUnit(assetId, unitId, toTop) {
    const unitData = getGameAssetById(ASSET_TYPE.UNIT, assetId);
    const direction = toTop ? DIRECTION.UP : DIRECTION.DOWN;
    const unit = new Unit(unitId, unitData, direction, null);
    this.myUnits.push(unit);
    this.myUnitMap.set(unitId, unit);
  }

  addOpponentUnit(assetId, unitId, toTop) {
    const unitData = getGameAssetById(ASSET_TYPE.UNIT, assetId);
    const direction = toTop ? DIRECTION.UP : DIRECTION.DOWN;
    const unit = new Unit(unitId, unitData, direction, null);
    this.opponentUnits.push(unit);
    this.opponentUnitMap.set(unitId, unit);
  }

  moveUnit(unit, time) {
    const startPos = unit.getPosition();
    const endPos = unit.getDestination().point;

    const scalarDist = (unit.getSpeed() * time) / 1000; // 주어진 시간동안 유닛이 이동할 수 있는 직선거리
    const totalScalarDist = calcDist(startPos, endPos); // 유닛의 현재 위치에서 목적지까지의 거리
    const progressRate = scalarDist / totalScalarDist; // 유닛이 목적지까지 나아간 거리의 비율

    const x = startPos.x + (endPos.x - startPos.x) * progressRate;
    const z = startPos.z + (endPos.z - startPos.z) * progressRate;

    unit.position = { x, z };

    if (unit.arrivedAtDestination()) {
      unit.updateDestination();
    }
  }

  moveUnits(time) {
    this.myUnits.forEach((unit) => {
      this.moveUnit(unit, time);
    });
    this.opponentUnits.forEach((unit) => {
      this.moveUnit(unit, time);
    });
  }

  startMovingUnits() {
    // 기존 타이머가 있다면 제거
    this.stopMovingUnits();

    this.moveTimer = setInterval(() => {
      this.moveUnits(moveInterval);
    }, moveInterval); // n초마다 실행
  }

  stopMovingUnits() {
    if (this.moveTimer) {
      clearInterval(this.moveTimer);
      this.moveTimer = null;
    }
  }

  setUnitPosition(unit, pos) {
    unit.position = pos;
  }

  async initialize() {
    // proto 파일 로드
    this.root = await protobuf.load(path.resolve(__dirname, '../../protobuf/packet.proto'));
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
        logger.info(packetName + ' 받았음!');
        const response = { ...decodedPayload[snakeToCamel(packetName)] };
        switch (packetType) {
          case PACKET_TYPE.MATCH_NOTIFICATION: {
            loadGameAssets();
            break;
          }
          case PACKET_TYPE.GAME_START_NOTIFICATION: {
            this.startMovingUnits();
            break;
          }
          case PACKET_TYPE.SPAWN_UNIT_RESPONSE: {
            const { assetId, unitId, toTop } = response;
            console.log(`내 유닛 소환 - unitId: ${unitId}, assetId:, ${assetId}`);
            this.addMyUnit(assetId, unitId, toTop);
            break;
          }
          case PACKET_TYPE.SPAWN_ENEMY_UNIT_NOTIFICATION: {
            const { assetId, unitId, toTop } = response;
            this.addOpponentUnit(assetId, unitId, toTop);
            console.log(`상대방 유닛 소환:, ${unitId}`);
            break;
          }
          case PACKET_TYPE.LOCATION_SYNC_NOTIFICATION: {
            const { unitPositions } = response;
            unitPositions.forEach((unitPosition) => {
              const { unitId, position } = unitPosition;
              let team = '내';
              let unit = this.myUnitMap.get(unitId);
              if (!unit) {
                unit = this.opponentUnitMap.get(unitId);
                team = '상대방';
              }
              console.log(`--- ${team} 유닛 ${unitId} 의 위치 보정`);
              console.log(
                `기존 위치: ${Math.trunc(unit.getPosition().x)}, z: ${Math.trunc(unit.getPosition().z)}`,
              );
              this.setUnitPosition(unit, position);
              console.log(
                `보정된 위치: ${Math.trunc(unit.getPosition().x)}, z: ${Math.trunc(unit.getPosition().z)}`,
              );
            });
            break;
          }
          case PACKET_TYPE.GAME_OVER_NOTIFICATION: {
            // 게임오버 처리 생략
            this.stopMovingUnits();
            break;
          }
          default:
            break;
        }
      }
    } catch (error) {
      logger.error(`[클라이언트 ${this.id}] 패킷 처리 중 오류 발생:`, error);
    }
  }

  async playContents() {
    const contents = LOCATION_SYNC_TEST_2;
    for (const content of contents) {
      const packetType = content.packetType;
      let payload = content.payload;

      let encodedPayload = { [snakeToCamel(PACKET_TYPE_REVERSED[packetType])]: payload };
      let packet = this.createPacket(packetType, encodedPayload);

      if (packetType === PACKET_TYPE.LOCATION_NOTIFICATION) {
        // 기존 타이머가 있다면 제거
        if (this.packetSendTimer) {
          clearInterval(this.packetSendTimer);
          this.moveTimer = null;
        }

        this.packetSendTimer = setInterval(() => {
          // 유닛 업데이트 부분
          const unitPositions = [];
          this.myUnits.forEach((unit) => {
            const unitId = unit.getUnitId();
            const position = unit.getPosition();
            unitPositions.push({ unitId, position });
            console.log(`--- 서버로 유닛 위치 전송`);
            console.log(`유닛 ${unitId}: ${Math.trunc(position.x)}, z: ${Math.trunc(position.z)}`);
          });

          const timestamp = Date.now();
          payload = { unitPositions, timestamp };

          // 패킷 생성 및 전송 부분
          let encodedPayload = { [snakeToCamel(PACKET_TYPE_REVERSED[packetType])]: payload };
          let packet = this.createPacket(packetType, encodedPayload);

          this.socket.write(packet);
        }, locationPacketSendInterval); // n초마다 실행
      } else {
        this.socket.write(packet);
      }

      logger.info(`${PACKET_TYPE_REVERSED[packetType]} 패킷을 전송하였습니다.`);
      await delay(content.duration);
    }
  }

  close() {
    this.socket.end();
    logger.info(`[클라이언트 ${this.id}] 연결이 종료되었습니다`);
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
  const host = '127.0.0.1';
  const port = 5555;

  const clients = await simulateClients(clientCount, host, port);

  setTimeout(async () => {
    clients.forEach((client) => client.close());
    console.log('모든 클라이언트 연결 종료');
  }, 100000); // 5초 후 종료
}

main();
