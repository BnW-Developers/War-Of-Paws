import CustomErr from '../utils/error/customErr.js';
import { errCodes } from '../utils/error/errCodes.js';
import { handleErr } from '../utils/error/handlerErr.js';

export const onError = (socket) => (err) => {
  console.error('Socket Error:', err?.message);
  handleErr(socket, new CustomErr(errCodes.SOCKET_ERR, `Socket Error: ${err.message}`));
};
