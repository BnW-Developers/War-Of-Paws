import CustomErr from '../utils/error/customErr.js';
import { handleErr } from '../utils/error/handlerErr.js';

export const onError = (socket) => (err) => {
  console.error('Socket Error:', err?.message);
  handleErr(socket, new CustomErr(500, `Socket Error: ${err.message}`));
  // 에러처리(등록된 유저라던지, 세션 처리)
};
