import net from 'net';
import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  LOCATION_SYNC_TEST_1,
  LOCATION_SYNC_TEST_2,
  LOCATION_SYNC_TEST_3,
  LOCATION_SYNC_TEST_4,
} from './contents.js';
import { PACKET_TYPE, PACKET_TYPE_REVERSED } from '../../constants/header.js';
import { delay } from '../../utils/util/delay.js';
import { snakeToCamel } from '../../utils/formatter/snakeToCamel.js';
import { getGameAssetById } from '../../utils/assets/getAssets.js';
import { ASSET_TYPE, DIRECTION } from '../../constants/assets.js';
import Unit from '../../classes/models/unit.class.js';
import calcDist from '../../utils/location/calcDist.js';
import { loadGameAssets } from '../../init/loadAssets.js';
import formatTime from '../../utils/formatter/timeFormatter.js';
import chalk from 'chalk';
import formatCoords from '../../utils/formatter/formatCoords.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = __filename.split('\\');
const pureFileName = dirs[dirs.length - 1];
let contents = null;
switch (pureFileName) {
  case 'client1.js':
    contents = LOCATION_SYNC_TEST_1;
    break;
  case `client2.js`:
    contents = LOCATION_SYNC_TEST_2;
    break;
  case `client3.js`:
    contents = LOCATION_SYNC_TEST_3;
    break;
  case `client4.js`:
    contents = LOCATION_SYNC_TEST_4;
    break;
  default:
    console.error(chalk.redBright(`invalid filename: ${pureFileName}`));
}

const SERVER_ADDRESS = Object.freeze({
  REMOTE: { HOST: '13.124.152.37', PORT: 3000 },
  LOCAL: { HOST: '127.0.0.1', PORT: 5555 },
});

const UNIT_TEST = Object.freeze({
  BASIC: 0,
  OUT_OF_BOUNDS_W: 1,
  OUT_OF_BOUNDS_N: 2,
  OUT_OF_BOUNDS_E: 3,
  OUT_OF_BOUNDS_S: 4,
  TOO_FAST: 5,
  // 추가
});

// 서버 주소 설정
const isLocal = true; // true: LOCAL   false: REMOTE
const { HOST, PORT } = isLocal ? SERVER_ADDRESS.LOCAL : SERVER_ADDRESS.REMOTE;

// 유닛 테스트 선택
const currentTest = UNIT_TEST.BASIC; //eslint-disable-line

const moveInterval = 50;
const locationPacketSendInterval = 200; // ms

function printHeader(tag, outgoing = false, error = false) {
  let header = `[${tag}] ${formatTime(Date.now()).toString().split('  ')[1]}`;
  if (outgoing) {
    header = '     ' + header;
  }
  if (error) {
    header = chalk.redBright(header);
  }
  console.log(header);
}

function printMessage(message, outgoing = false, error = false) {
  if (outgoing) {
    message = '     ' + message;
  }
  if (error) {
    message = chalk.redBright(message);
  }
  console.log(message);
}

function printLsHeader(tag, outgoing = false) {
  let header = `[${tag}] ${formatTime(Date.now()).toString().split('  ')[1]}`;
  if (outgoing) {
    header = '     ' + header + ' LOCATION';
  } else {
    header = header + ' LOCATION_SYNC';
  }
  console.log(header);
}

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
    return unit;
  }

  addOpponentUnit(assetId, unitId, toTop) {
    const unitData = getGameAssetById(ASSET_TYPE.UNIT, assetId);
    const direction = toTop ? DIRECTION.UP : DIRECTION.DOWN;
    const unit = new Unit(unitId, unitData, direction, null);
    this.opponentUnits.push(unit);
    this.opponentUnitMap.set(unitId, unit);
    return unit;
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
    unit.rotation = { y: Math.floor(Math.random() * 360) };

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

  setUnitPosition(unit, pos, rot) {
    unit.position = pos;
    unit.rotation = rot;
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
        printHeader('연결');
        resolve();
      });

      this.socket.on('error', (error) => {
        printHeader('소켓 에러', false, true);
        printMessage(error, false, true);
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
    } catch (error) {
      printHeader('패킷 파싱 오류', false, true);
      printMessage(error, false, true);
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
        if (packetType === PACKET_TYPE.ERROR_NOTIFICATION) {
          printHeader('수신', false, true);
          printMessage(packetName, false, true);
        } else if (packetType === PACKET_TYPE.LOCATION_SYNC_NOTIFICATION) {
          printLsHeader('수신');
        } else {
          printHeader('수신');
          printMessage(packetName);
        }
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
            const unit = this.addMyUnit(assetId, unitId, toTop);
            const position = unit.getPosition();
            const rotation = unit.getRotation();
            const message = chalk.greenBright(`유닛 ${unitId} 소환: ${formatCoords(position, 2)}`);
            printMessage(message);
            printMessage(chalk.greenBright(`rotation: ${rotation.y}`));
            break;
          }
          case PACKET_TYPE.SPAWN_ENEMY_UNIT_NOTIFICATION: {
            const { assetId, unitId, toTop } = response;
            const unit = this.addOpponentUnit(assetId, unitId, toTop);
            const position = unit.getPosition();
            const rotation = unit.getRotation();
            const message = chalk.yellowBright(`유닛 ${unitId} 소환: ${formatCoords(position, 2)}`);
            printMessage(message);
            printMessage(chalk.greenBright(`rotation: ${rotation.y}`));
            break;
          }
          case PACKET_TYPE.LOCATION_SYNC_NOTIFICATION: {
            const { unitPositions } = response;
            unitPositions.forEach((unitPosition) => {
              const { unitId, position, rotation } = unitPosition;
              let unit = this.myUnitMap.get(unitId);
              let isMyUnit = true;
              if (!unit) {
                unit = this.opponentUnitMap.get(unitId);
                isMyUnit = false;
              }
              const pos_before = unit.getPosition();
              const rot_before = unit.getRotation();
              this.setUnitPosition(unit, position, rotation);
              const pos_after = unit.getPosition();
              const rot_after = unit.getRotation();
              if (isMyUnit) {
                const message = chalk.greenBright(
                  `유닛${unitId}:${formatCoords(pos_before, 2)}->${formatCoords(pos_after, 2)}`,
                );
                printMessage(message);
                printMessage(chalk.greenBright(`rotation:${rot_before.y} -> ${rot_after.y}`));
              } else {
                const message = chalk.yellowBright(
                  `유닛${unitId}:${formatCoords(pos_before, 2)}->${formatCoords(pos_after, 2)}`,
                );
                printMessage(message);
                printMessage(chalk.yellowBright(`rotation:${rot_before.y} -> ${rot_after.y}`));
              }
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
      printHeader('패킷 처리 오류', false, true);
      printMessage(error, false, true);
    }
  }

  async playContents() {
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
          printLsHeader('발신', true);
          // 유닛 업데이트 부분
          const unitPositions = [];
          this.myUnits.forEach((unit) => {
            const unitId = unit.getUnitId();
            const position = unit.getPosition();
            const rotation = unit.getRotation();
            unitPositions.push({ unitId, position, rotation });
            const message = chalk.greenBright(`유닛${unitId}:${formatCoords(position, 2)}`);

            printMessage(message, true);
            printMessage(chalk.yellowBright(`rotation:${rotation.y}`), true);
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
        printHeader('발신', true);
        printMessage(PACKET_TYPE_REVERSED[packetType], true);
      }

      await delay(content.duration);
    }
  }

  close() {
    this.socket.end();
    printHeader('연결 종료');
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
      printHeader('클라이언트 초기화 실패', false, true);
      printMessage(error, false, true);
    }
  }

  return clients;
}

async function main() {
  const clientCount = 1;
  const clients = await simulateClients(clientCount, HOST, PORT);

  setTimeout(async () => {
    clients.forEach((client) => client.close());
    printHeader('모든 클라이언트 연결 종료');
  }, 100000); // 5초 후 종료
}

main();
