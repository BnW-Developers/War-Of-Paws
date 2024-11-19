# handleErr 함수 사용법

이 문서는 `handleErr` 함수의 사용법을 설명합니다.
`handleErr` 함수는 소켓에서 발생한 에러를 처리하며, 적절한 에러 메시지를 클라이언트로 전송하는 역할을 합니다.
다만, `customErr`로 생성되지 않은 오류는 패킷 전송하지 않고 `console.error`를 띄웁니다.

## 함수 정의

```javascript
export const handleErr = (socket, err) => {
  let errorCode;
  let errorMessage = err.message;

  if (err.code) {
    errorCode = err.code;
    console.error(`Error Type:${type} Code: ${responseCode}, Message : ${message}`);
    socket.write(
      createResponse(PACKET_TYPE.ERROR_NOTIFICATION, socket.sequence++, {
        errorCode,
        errorMessage,
      }),
    );
  } else {
    console.error(`Socket Error: ${message}`);
  }
};
```

## 매개변수

- `socket` (Object): 에러가 발생한 소켓 객체입니다.
- `err` (Object): 발생한 에러 객체입니다. catch 블록으로 넘어오는 error 객체를 그대로 넘겨주면 됩니다.

## 반환값

- 이 함수는 반환값이 없습니다. 에러를 처리한 후, 클라이언트로 에러 응답을 전송 또는 콘솔 에러를 출력합니다.

## 예제 사용법

```javascript
try {
  // 커스텀 에러 (클라이언트에게 에러 패킷이 전달됨)
  throw new CustomErr(errCodes.MISSING_FIELDS, '필드 하나 누락됐소');

  // 그냥 에러 (콘솔 에러 출력)
  throw new Error('로직 중 문제가 될 부분 체크');
} catch (err) {
  handleErr(socket, err);
}
```

## 주의사항

- 클라이언트에게 에러 패킷을 보내고자 하여 CustomErr을 쓸 경우 꼭 errCodes 에서 참조하세요 (그 외 에러 투척)
