import { PACKET_TYPE } from '../../constants/header.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { createResponse } from '../response/createResponse.js';

// TODO: 에러 처리 방식 생각 후 수정 필요

export const handleErr = (socket, type, err) => {
  let failCode;
  let message;

  if (err.code) {
    failCode = err.code;
    message = err.message;
    console.error(`Error Type:${type} Code: ${responseCode}, Message : ${message}`);
  } else {
    failCode = GlobalFailCode.UNKNOWN_ERROR;
    message = err.message;
    console.error(`Socket Error: ${message}`);
  }

  //INCOMPLETE: 시퀀스 부분 연동 필요
  const errResponse = createResponse(type, 1, {
    success: false,
    message,
    failCode,
  });
  socket.write(errResponse);
};
