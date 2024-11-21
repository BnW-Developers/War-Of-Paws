import { PACKET_TYPE } from '../../constants/header.js';
import { createUser, findUserById } from '../../mysql/user/user.db.js';
import CustomErr from '../../utils/error/customErr.js';
import { errCodes } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { validateSignUp } from '../../utils/joi/validateSignUp.js';
import logger from '../../utils/logger.js';
import { createResponse } from '../../utils/response/createResponse.js';
import bcrypt from 'bcrypt';

const registerRequest = async (socket, payload) => {
  try {
    // C2SRegisterRequest
    const { id, email, password } = payload;
    logger.info(`register request id: ${id}`);

    // id, email, password가 정해진 형식과 다를 경우 오류
    if (!validateSignUp(payload)) {
      throw new CustomErr(errCodes.INVALID_REGISTER_FORMAT, '입력한 형식이 올바르지 않습니다.');
    }

    const user = await findUserById(id);
    if (user) {
      // 같은 id를 가진 유저가 이미 존재하는 경우
      throw new CustomErr(errCodes.DUPLICATE_USER_ID, '이미 존재하는 아이디입니다.');
    }

    // 유저 생성
    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser(id, hashedPassword, email);

    logger.info(`register success id: ${id}`);

    // 응답 전송
    const response = createResponse(PACKET_TYPE.REGISTER_RESPONSE, 1, {});
    sendPacket.enQueue(socket, response);
  } catch (err) {
    handleErr(socket, err);
  }
};

export default registerRequest;
