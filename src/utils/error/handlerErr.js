import { PACKET_TYPE } from '../../constants/header.js';
import { createPacket } from '../response/createPacket.js';
import { findValueInObject } from '../util/findValueInObject.js';
import logger from '../log/logger.js';
import { ERR_CODES } from './errCodes.js';

export const handleErr = (socket, err) => {
  let errorCode;
  let errorMessage = err.message;

  // 개발 단계 stack trace 출력
  console.error(err);

  if (err.code) {
    if (!findValueInObject(ERR_CODES, err.code)) {
      logger.error(`Error Code: ${err.code} is not defined in ERR_CODES`);
      return;
    }

    errorCode = err.code;
    logger.error(`Code: ${errorCode}, Message : ${errorMessage}`);
    socket.write(
      createPacket(PACKET_TYPE.ERROR_NOTIFICATION, socket.sequence++, {
        errorCode,
        errorMessage,
      }),
    );
  } else {
    logger.error(`Socket Error: ${errorMessage}`);
  }
};
