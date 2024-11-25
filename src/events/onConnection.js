import { blockList } from '../server.js';
import { ERR_CODES } from '../utils/error/errCodes.js';
import { handleErr } from '../utils/error/handlerErr.js';
import { onData } from './onData.js';
import { onEnd } from './onEnd.js';
import { onError } from './onError.js';
import { v4 as uuidV4 } from 'uuid';

export const onConnection = (socket) => {
  const remoteAddress = socket.remoteAddress;

  if (blockList.check(remoteAddress)) {
    console.log('Blocked connection from', remoteAddress);
    handleErr(socket, { code: ERR_CODES.SOCKET_ERR, message: 'Your IP is banned' });
    socket.destroy();
    socket.end();
  } else {
    console.log('Allowed connection from', remoteAddress);
    socket.buffer = Buffer.alloc(0);
    socket.clientId = uuidV4();
    socket.sequence = 0;
    socket.illegalCount = 0;

    socket.on('data', onData(socket));
    socket.on('end', onEnd(socket));
    socket.on('error', onError(socket));
  }
};
