# createResponse 함수 사용법

이 문서는 `createResponse` 함수의 사용법을 설명합니다.
`createResponse` 함수는 패킷을 생성하여 네트워크 전송을 위한 버퍼를 반환하는 역할을 합니다.

## 함수 정의

```javascript
export const createResponse = (Type, seq, data = null) => {
  if (!PACKET_TYPE_REVERSED.has(Type)) throw new Error('Invalid Packet Type');

  const typeName = PACKET_TYPE_REVERSED[Type];
  const camel = snakeToCamel(typeName);

  const response = {
    [camel]: data,
  };

  const payload = GamePacket.encode(response).finish();

  const packetType = Buffer.alloc(config.packet.typeLength);
  packetType.writeUInt16BE(Type, 0);

  const versionLength = Buffer.alloc(config.packet.versionLength);
  const vLen = config.client.version.length;
  versionLength.writeUInt8(vLen, 0);

  const version = Buffer.alloc(vLen);
  Buffer.from(config.client.version).copy(version);

  const sequence = Buffer.alloc(config.packet.sequence);
  sequence.writeUInt32BE(seq, 0); // 현재는 시퀀스 관리 없이 증가

  const payloadLength = Buffer.alloc(config.packet.payloadLength);
  payloadLength.writeUInt32BE(payload.length, 0);

  return Buffer.concat([packetType, versionLength, version, sequence, payloadLength, payload]);
};
```

## 매개변수

- `Type` (Number): 패킷의 타입을 나타내는 숫자이며, 사용 시 PACKET_TYPE을 활용하면 됩니다.
- `seq` (Number): 시퀀스 번호로, 현재는 onConnection 시 생성되는 socket.sequence의 숫자를 순차적으로 증가시켜 반환합니다.
- `data` (Object | null): 패킷에 포함될 페이로드로, 기본값은 `null`입니다.

## 반환값

- `Buffer`: 인코딩 된 버퍼를 반환합니다.

## 예제 사용법

```javascript
socket.write(
  createResponse(PACKET_TYPE.REGISTER_RESPONSE, socket.sequence++, { message: 'good boy,' }),
);
```

## 주의사항

- `PACKET_TYPE`에 있는 패킷 타입만 가능합니다. 그 외에는 error 처리됩니다.
- 현재 따로 시퀀스를 관리하지 않기 때문에 seq 꼭 `socket.sequence++` 로 넘겨줘야 합니다.
