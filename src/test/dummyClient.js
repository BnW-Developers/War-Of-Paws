import net from 'net';
import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PACKET_TYPE, PACKET_TYPE_REVERSED } from '../constants/header.js';
import { snakeToCamel } from '../utils/formatter/snakeToCamel.js';
import { delay } from '../utils/util/delay.js';

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
        console.log('서버에 연결됨');
        resolve();
      });

      this.socket.on('error', (error) => {
        console.error('소켓 에러:', error);
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
      console.error(err);
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
    console.log('매칭 요청을 보냈습니다');
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
    console.log('매칭 취소 요청을 보냈습니다');
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
    console.log('게임 시작 요청을 보냈습니다');
  }

  // 패킷 받았을 때 처리
  handlePacket(packet) {
    try {
      const packetType = packet.packetType;
      console.log('packetType: ', packetType);
      const decodedPayload = this.GamePacket.decode(packet.payload);
      console.log('decodedPayload: ', decodedPayload);
      this.lastReceivedPacket = decodedPayload;

      if (packetType) {
        const packetName = PACKET_TYPE_REVERSED[packetType];
        console.log(packetName + ' 받았음!');
        const response = { ...decodedPayload[snakeToCamel(packetName)] };
        console.log('response: ', response);
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
      console.error('패킷 처리 중 오류 발생:', error);
    }
  }

  async playContents() {
    const contents = this.content;
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

      this.socket.write(packet);
      console.log(`${PACKET_TYPE_REVERSED[packetType]} 패킷을 전송하였습니다.`);
      console.log('packetType: ', packetType);
      console.log('payload: ', payload);
      await delay(content.duration);
    }
  }

  close() {
    this.socket.destroy();
    console.log('연결이 종료되었습니다');
  }
}

export { DummyClient };
