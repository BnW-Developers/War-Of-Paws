import net from 'net';
import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PACKET_TYPE, PACKET_TYPE_REVERSED } from '../constants/header.js';
import { snakeToCamel } from '../utils/formatter/snakeToCamel.js';
import { delay } from '../utils/util/delay.js';
import { printHeader, printMessage } from './util/print.js';
import {
  CURRENT_TEST,
  TEST_LOG_ENABLED_ATTACK_BASE,
  TEST_LOG_ENABLED_DRAW_CARD,
  TEST_LOG_ENABLED_ERROR,
  TEST_LOG_ENABLED_GAME_OVER,
  TEST_LOG_ENABLED_GAME_START,
  TEST_LOG_ENABLED_LOCATION_SYNC,
  TEST_LOG_ENABLED_MATCH,
  TEST_LOG_ENABLED_MINERAL_SYNC,
  TEST_LOG_ENABLED_PAYLOAD,
  TEST_LOG_ENABLED_SPAWN_UNIT,
  UNIT_TEST,
} from './constants/testSwitch.js';
import { loadGameAssets } from '../init/loadAssets.js';
import {
  client_checkCardValidity,
  client_addCard,
  client_addEliteCard,
  client_addMyUnit,
  client_addOpponentUnit,
  client_getRandomCard,
  client_removeCard,
  client_setUnitPosition,
  client_startMovingUnits,
  client_stopMovingUnits,
  client_checkMergeCondition,
} from './util/unit.js';
import chalk from 'chalk';
import formatCoords from '../utils/formatter/formatCoords.js';
import { LOCATION_SYNC_INTERVAL } from './constants/testConfig.js';
import { INITIAL_MINERAL } from '../constants/game.constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DummyClient {
  constructor(content) {
    this.content = content;
    this.socket = new net.Socket();
    this.sequence = 0;
    this.buffer = Buffer.alloc(0);
    this.root = null;
    this.GamePacket = null;
    this.lastReceivedPacket = null;
    this.species = null;
    this.cards = new Map();
    this.numCards = 0;
    this.myUnits = [];
    this.opponentUnits = [];
    this.myUnitMap = new Map();
    this.opponentUnitMap = new Map();
    this.mineral = INITIAL_MINERAL;
    this.moveTimer = null;
    this.movingUnits = 0;
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
    // 페이로드 인코딩
    const message = this.GamePacket.create(payload);
    const encodedPayload = this.GamePacket.encode(message).finish();

    // 전체 패킷 크기 계산
    const versionStr = '1.0.0';
    const packetSize =
      2 + // 패킷 타입 (uint16)
      1 + // 버전 길이 (uint8)
      versionStr.length + // 버전 문자열
      4 + // 시퀀스 (uint32)
      2 + // 페이로드 길이 (uint16)
      encodedPayload.length; // 실제 페이로드

    // 버퍼 생성
    const buffer = Buffer.alloc(packetSize);
    let offset = 0;

    // 패킷 타입 (uint16) 작성
    buffer.writeUInt16BE(packetType, offset);
    offset += 2;

    // 버전 길이 (uint8) 작성
    buffer.writeUInt8(versionStr.length, offset);
    offset += 1;

    // 버전 문자열 작성
    buffer.write(versionStr, offset);
    offset += versionStr.length;

    // 시퀀스 (uint32) 작성
    buffer.writeUInt32BE(10, offset);
    offset += 4;

    // 페이로드 길이 (uint16) 작성
    buffer.writeUInt16BE(encodedPayload.length, offset);
    offset += 2;

    // 페이로드 작성
    encodedPayload.copy(buffer, offset);

    return buffer;
  }

  parsePacket() {
    try {
      let offset = 0;

      // 패킷 타입 파싱 (2바이트)
      if (this.buffer.length < offset + 2) return null;
      const packetType = this.buffer.readUInt16BE(offset);
      offset += 2;

      // 버전 길이 파싱 (1바이트)
      if (this.buffer.length < offset + 1) return null;
      const versionLength = this.buffer.readUInt8(offset);
      offset += 1;

      // 버전 파싱
      if (this.buffer.length < offset + versionLength) return null;
      const version = this.buffer.slice(offset, offset + versionLength).toString();
      offset += versionLength;

      // 시퀀스 파싱 (4바이트)
      if (this.buffer.length < offset + 4) return null;
      const sequence = this.buffer.readUInt32BE(offset);
      offset += 4;

      // 페이로드 길이 파싱 (4바이트)
      if (this.buffer.length < offset + 2) return null;

      const payloadLength = this.buffer.readUInt16BE(offset);
      offset += 2;

      // 페이로드 파싱
      if (this.buffer.length < offset + payloadLength) return null;
      const payload = this.buffer.slice(offset, offset + payloadLength);
      offset += payloadLength;

      // 버퍼 업데이트
      this.buffer = this.buffer.slice(offset);

      return {
        packetType,
        version,
        sequence,
        payload,
      };
    } catch (err) {
      printHeader('패킷 파싱 오류', false, true);
      printMessage(err, false, true);
    }
  }

  handleData(data) {
    // 받은 데이터를 버퍼에 추가
    this.buffer = Buffer.concat([this.buffer, data]);
    // 패킷 파싱 및 처리
    while (this.buffer.length >= 3) {
      // 최소 크기(type 2바이트 + versionLength 1바이트)
      const packet = this.parsePacket();
      if (!packet) {
        break;
      }

      this.handlePacket(packet);
    }
  }

  sendInitPacket(token) {
    // 매칭 요청 메시지 생성
    const authRequest = {
      authRequest: {
        token: token,
      },
    };

    // 메시지 검증
    const errMsg = this.GamePacket.verify(authRequest);
    if (errMsg) throw Error(errMsg);

    // 패킷 생성
    // 패킷 타입이랑 payload 이름 맞춰줘야 함
    const packet = this.createPacket(PACKET_TYPE.AUTH_REQUEST, authRequest);
    this.socket.write(packet);
  }

  // 요청 전송
  // 복붙해서 새로운 메서드 생성해서 사용
  sendMatchRequest(animalType) {
    // 매칭 요청 메시지 생성
    const matchRequest = {
      matchRequest: {
        species: animalType,
      },
    };

    // 메시지 검증
    const errMsg = this.GamePacket.verify(matchRequest);
    if (errMsg) throw Error(errMsg);

    // 패킷 생성
    // 패킷 타입이랑 payload 이름 맞춰줘야 함
    const packet = this.createPacket(PACKET_TYPE.MATCH_REQUEST, matchRequest);
    this.socket.write(packet);
    printHeader('발신', true);
    printMessage('매칭 요청', true);
  }

  sendMatchCancelRequest() {
    // 매칭 요청 메시지 생성
    const matchCancelRequest = {
      matchCancelRequest: {},
    };

    // 메시지 검증
    const errMsg = this.GamePacket.verify(matchCancelRequest);
    if (errMsg) throw Error(errMsg);

    // 패킷 생성
    // 패킷 타입이랑 payload 이름 맞춰줘야 함
    const packet = this.createPacket(PACKET_TYPE.MATCH_CANCEL_REQUEST, matchCancelRequest);
    this.socket.write(packet);
    printHeader('발신', true);
    printMessage('매칭 취소 요청', true);
  }

  sendGameStartRequest() {
    const gameStartRequest = {
      gameStartRequest: {},
    };

    // 메시지 검증
    const errMsg = this.GamePacket.verify(gameStartRequest);
    if (errMsg) throw Error(errMsg);

    // 패킷 생성
    // 패킷 타입이랑 payload 이름 맞춰줘야 함
    const packet = this.createPacket(PACKET_TYPE.GAME_START_REQUEST, gameStartRequest);
    this.socket.write(packet);
    printHeader(`발신`, true);
    printMessage('게임 시작 요청', true);
  }

  // 패킷 받았을 때 처리
  handlePacket(packet) {
    try {
      const packetType = packet.packetType;
      const decodedPayload = this.GamePacket.decode(packet.payload);
      this.lastReceivedPacket = decodedPayload;

      if (packetType) {
        const packetName = PACKET_TYPE_REVERSED[packetType];
        const response = { ...decodedPayload[snakeToCamel(packetName)] };

        switch (packetType) {
          case PACKET_TYPE.ERROR_NOTIFICATION: {
            if (TEST_LOG_ENABLED_ERROR) {
              printHeader('수신', false, true);
              printMessage(packetName, false, true);
              printMessage(
                `errorCode: ${response.errorCode}, errorMessage: ${response.errorMessage}`,
              );
            }

            break;
          }
          case PACKET_TYPE.MATCH_NOTIFICATION: {
            if (TEST_LOG_ENABLED_MATCH) {
              printHeader('수신');
              printMessage(packetName);
              if (TEST_LOG_ENABLED_PAYLOAD) printMessage(decodedPayload);
            }

            loadGameAssets();
            break;
          }
          case PACKET_TYPE.GAME_START_NOTIFICATION: {
            if (TEST_LOG_ENABLED_GAME_START) {
              printHeader('수신');
              printMessage(packetName);
              if (TEST_LOG_ENABLED_PAYLOAD) printMessage(decodedPayload);
            }

            client_startMovingUnits(this);
            break;
          }
          case PACKET_TYPE.DRAW_CARD_RESPONSE: {
            const { assetId } = response;
            if (TEST_LOG_ENABLED_DRAW_CARD) {
              printHeader('수신');
              printMessage(packetName);
              if (TEST_LOG_ENABLED_PAYLOAD) printMessage(decodedPayload);
            }

            client_checkCardValidity(this, assetId);
            client_addCard(this, assetId);

            if (TEST_LOG_ENABLED_DRAW_CARD) {
              printMessage(`뽑은 카드: ${assetId}`);
              printMessage(`남은 자원: ${this.mineral}`);
            }

            break;
          }
          case PACKET_TYPE.ELITE_CARD_NOTIFICATION: {
            const { consumedAssetId, eliteAssetId } = response;
            if (TEST_LOG_ENABLED_DRAW_CARD) {
              printHeader('수신');
              printMessage(packetName);
              if (TEST_LOG_ENABLED_PAYLOAD) printMessage(decodedPayload);
            }

            client_checkMergeCondition(this, consumedAssetId);
            client_addEliteCard(this, consumedAssetId, eliteAssetId);

            if (TEST_LOG_ENABLED_DRAW_CARD) {
              printMessage(`뽑은 엘리트 카드: ${consumedAssetId}`);
            }

            break;
          }
          case PACKET_TYPE.SPAWN_UNIT_RESPONSE: {
            const { assetId, unitId, toTop } = response;
            client_removeCard(this, assetId);
            const unit = client_addMyUnit(this, assetId, unitId, toTop);
            const position = unit.getPosition();
            const rotation = unit.getRotation();

            if (TEST_LOG_ENABLED_SPAWN_UNIT) {
              printHeader('수신');
              printMessage(packetName);
              if (TEST_LOG_ENABLED_PAYLOAD) printMessage(decodedPayload);

              const message = chalk.greenBright(
                `유닛 ${unitId} 소환: ${formatCoords(position, 2)}`,
              );
              printMessage(message);
              if (CURRENT_TEST === UNIT_TEST.ROTATION)
                printMessage(chalk.greenBright(`rotation: ${rotation.y}`));
            }

            break;
          }
          case PACKET_TYPE.SPAWN_ENEMY_UNIT_NOTIFICATION: {
            const { assetId, unitId, toTop } = response;
            const unit = client_addOpponentUnit(this, assetId, unitId, toTop);
            const position = unit.getPosition();
            const rotation = unit.getRotation();

            if (TEST_LOG_ENABLED_SPAWN_UNIT) {
              printHeader('수신');
              printMessage(packetName);
              if (TEST_LOG_ENABLED_PAYLOAD) printMessage(decodedPayload);

              const message = chalk.yellowBright(
                `유닛 ${unitId} 소환: ${formatCoords(position, 2)}`,
              );
              printMessage(message);
              if (CURRENT_TEST === UNIT_TEST.ROTATION)
                printMessage(chalk.yellowBright(`rotation: ${rotation.y}`));
            }

            break;
          }
          case PACKET_TYPE.LOCATION_SYNC_NOTIFICATION: {
            if (TEST_LOG_ENABLED_LOCATION_SYNC) {
              printHeader('수신');
              printMessage(packetName);
              if (TEST_LOG_ENABLED_PAYLOAD) printMessage(decodedPayload);
            }

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
              client_setUnitPosition(unit, position, rotation);
              const pos_after = unit.getPosition();
              const rot_after = unit.getRotation();
              if (TEST_LOG_ENABLED_LOCATION_SYNC) {
                if (isMyUnit) {
                  const message = chalk.greenBright(
                    `유닛${unitId}:${formatCoords(pos_before, 2)}->${formatCoords(pos_after, 2)}`,
                  );
                  printMessage(message);
                  if (CURRENT_TEST === UNIT_TEST.ROTATION)
                    printMessage(chalk.greenBright(`rotation:${rot_before.y} -> ${rot_after.y}`));
                } else {
                  const message = chalk.yellowBright(
                    `유닛${unitId}:${formatCoords(pos_before, 2)}->${formatCoords(pos_after, 2)}`,
                  );
                  printMessage(message);
                  if (CURRENT_TEST === UNIT_TEST.ROTATION)
                    printMessage(chalk.yellowBright(`rotation:${rot_before.y} -> ${rot_after.y}`));
                }
              }
            });
            break;
          }
          case PACKET_TYPE.MINERAL_SYNC_NOTIFICATION: {
            const { mineral } = response;
            const prevMineral = this.mineral;
            this.mineral = mineral;

            if (TEST_LOG_ENABLED_MINERAL_SYNC) {
              printHeader('수신');
              printMessage(packetName);
              if (TEST_LOG_ENABLED_PAYLOAD) printMessage(decodedPayload);
              printMessage(`자원: ${prevMineral} -> ${mineral}`);
            }

            break;
          }
          case PACKET_TYPE.GAME_OVER_NOTIFICATION: {
            if (TEST_LOG_ENABLED_GAME_OVER) {
              printHeader('수신');
              printMessage(packetName);
              if (TEST_LOG_ENABLED_PAYLOAD) printMessage(decodedPayload);
            }

            client_stopMovingUnits(this);
            break;
          }
          default: {
            printHeader('수신');
            printMessage(packetName);
            if (TEST_LOG_ENABLED_PAYLOAD) printMessage(decodedPayload);

            break;
          }
        }
      }
    } catch (error) {
      printHeader('패킷 처리 오류', false, true);
      console.error(error);
    }
  }

  async playContents() {
    const contents = this.content;

    for (const content of contents) {
      const packetType = content.packetType;
      const packetName = PACKET_TYPE_REVERSED[packetType];
      let payload = content.payload;

      switch (packetType) {
        case PACKET_TYPE.DRAW_CARD_REQUEST: {
          if (CURRENT_TEST === UNIT_TEST.EXCEED_MAX_SLOTS) {
            // 기존 타이머가 있다면 제거
            if (this.drawCardTimer) {
              clearInterval(this.drawCardTimer);
            }

            this.drawCardTimer = setInterval(() => {
              if (TEST_LOG_ENABLED_DRAW_CARD) {
                printHeader('발신', true);
                printMessage(packetName, true);
                printMessage(`버튼: ${payload.buttonType}`, true);
              }

              const buttonType = Math.floor(Math.random() * 3) + 1;
              payload = { buttonType };
              // 패킷 생성 및 전송 부분
              let encodedPayload = { [snakeToCamel(packetName)]: payload };
              let packet = this.createPacket(packetType, encodedPayload);
              this.socket.write(packet);
            }, 100); // n초마다 실행
          } else {
            const buttonType = Math.floor(Math.random() * 3) + 1;
            payload = { buttonType };

            if (TEST_LOG_ENABLED_DRAW_CARD) {
              printHeader('발신', true);
              printMessage(packetName, true);
              printMessage(`버튼: ${payload.buttonType}`, true);
            }
          }

          break;
        }
        case PACKET_TYPE.SPAWN_UNIT_REQUEST: {
          const assetId = client_getRandomCard(this);
          const toTop = Boolean(Math.floor(Math.random() * 2));
          payload = { assetId, toTop };

          if (TEST_LOG_ENABLED_SPAWN_UNIT) {
            printHeader('발신', true);
            printMessage(packetName, true);
            printMessage(`assetId: ${assetId}, toTop: ${toTop}`);
          }
          break;
        }

        case PACKET_TYPE.LOCATION_NOTIFICATION: {
          // 기존 타이머가 있다면 제거
          if (this.locationSyncTimer) {
            clearInterval(this.locationSyncTimer);
            this.moveTimer = null;
          }

          this.locationSyncTimer = setInterval(() => {
            if (this.movingUnits > 0) {
              if (TEST_LOG_ENABLED_LOCATION_SYNC) {
                printHeader('발신', true);
                printMessage(packetName, true);
              }
              // 유닛 업데이트 부분
              const unitPositions = [];
              for (const unit of this.myUnits) {
                if (unit.arrived) continue;

                const unitId = unit.getUnitId();
                const position = unit.getPosition();
                const rotation = unit.getRotation();
                unitPositions.push({ unitId, position, rotation });

                if (TEST_LOG_ENABLED_LOCATION_SYNC) {
                  const message = chalk.greenBright(`유닛${unitId}:${formatCoords(position, 2)}`);
                  printMessage(message, true);
                  if (CURRENT_TEST === UNIT_TEST.ROTATION)
                    printMessage(chalk.yellowBright(`rotation:${rotation.y}`), true);
                }
              }

              payload = { unitPositions };
              if (TEST_LOG_ENABLED_LOCATION_SYNC) {
                if (TEST_LOG_ENABLED_PAYLOAD) printMessage(payload);
              }

              // 패킷 생성 및 전송 부분
              let encodedPayload = { [snakeToCamel(packetName)]: payload };
              let packet = this.createPacket(packetType, encodedPayload);

              this.socket.write(packet);
            }
          }, LOCATION_SYNC_INTERVAL); // n초마다 실행
          break;
        }

        case PACKET_TYPE.ENTER_CHECKPOINT_NOTIFICATION: {
          payload = { isTop: this.myUnits[0].isTop, unitId: this.myUnits[0].unitId };

          if (TEST_LOG_ENABLED_SPAWN_UNIT) {
            printHeader('발신', true);
            printMessage(packetName, true);
            if (TEST_LOG_ENABLED_PAYLOAD) printMessage(payload);
          }

          break;
        }

        case PACKET_TYPE.ATTACK_BASE_REQUEST: {
          payload = { unitId: this.myUnits[0].unitId };

          if (TEST_LOG_ENABLED_ATTACK_BASE) {
            printHeader('발신', true);
            printMessage(packetName, true);
            if (TEST_LOG_ENABLED_PAYLOAD) printMessage(payload);
          }

          break;
        }

        default: {
          printHeader('발신', true);
          printMessage(packetName, true);
          if (TEST_LOG_ENABLED_PAYLOAD) printMessage(payload);

          break;
        }
      }

      const cond1 = packetType === PACKET_TYPE.LOCATION_NOTIFICATION;
      const cond2 =
        packetType === PACKET_TYPE.DRAW_CARD_REQUEST && CURRENT_TEST === UNIT_TEST.EXCEED_MAX_SLOTS;
      if (!cond1 && !cond2) {
        const encodedPayload = { [snakeToCamel(packetName)]: payload };
        const packet = this.createPacket(packetType, encodedPayload);
        this.socket.write(packet);
      }

      await delay(content.duration);
    }
  }

  close() {
    this.socket.destroy();
    printHeader(`연결 종료`);
  }
}

export { DummyClient };
