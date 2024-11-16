import { PACKET_TYPE } from '../../constants/header.js';
import { createResponse } from '../response/createResponse.js';
import { findValueInObject } from '../util/findValueInObject.js';
import { errCodes } from './errCodes.js';

export const handleErr = (socket, err) => {
  let errorCode;
  let errorMessage = err.message;

  if (err.code) {
    if (!findValueInObject(errCodes, err.code)) throw new Error('Invalid Error Code');
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
