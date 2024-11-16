import { PACKET_TYPE } from '../../constants/header.js';
import { createResponse } from '../response/createResponse.js';
import { findValueInObject } from '../util/findValueInObject.js';
import { errCodes } from './errCodes.js';

export const handleErr = (socket, err) => {
  let errorCode;
  let errorMessage = err.message;

  if (err.code) {
    if (!findValueInObject(errCodes, err.code)) {
      console.error(`Error Code: ${err.code} is not defined in errCodes`);
      return;
    }

    errorCode = err.code;
    console.error(`Code: ${errorCode}, Message : ${errorMessage}`);

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
