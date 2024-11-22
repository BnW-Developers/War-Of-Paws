import { PACKET_TYPE } from '../../constants/header.js';
import { createUser, findUserById } from '../../mysql/user/user.db.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { validateSignUp } from '../../utils/joi/validateSignUp.js';
import logger from '../../utils/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';
import bcrypt from 'bcryptjs';

const registerRequest = async (socket, payload) => {
  try {
    // C2SRegisterRequest
    const { id, email, password } = payload;
    logger.info(`register request id: ${id}`);

    // id, email, password가 정해진 형식과 다를 경우 오류
    if (!validateSignUp(payload)) {
      throw new CustomErr(ERR_CODES.INVALID_REGISTER_FORMAT, '입력한 형식이 올바르지 않습니다.');
    }

    const user = await findUserById(id);
    if (user) {
      // 같은 id를 가진 유저가 이미 존재하는 경우
      throw new CustomErr(ERR_CODES.DUPLICATE_USER_ID, '이미 존재하는 아이디입니다.');
    }

    // 유저 생성
    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser(id, hashedPassword, email);

    logger.info(`register success id: ${id}`);

    // 패킷 전송
    sendPacket(socket, PACKET_TYPE.REGISTER_RESPONSE);
  } catch (err) {
    handleErr(socket, err);
  }
};

export default registerRequest;
