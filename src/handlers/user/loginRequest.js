import userSessionManager from '../../classes/managers/userSessionManager.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { findUserById } from '../../mysql/user/user.db.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { createJWT } from '../../utils/jwt/createToken.js';
import bcrypt from 'bcryptjs';
import logger from '../../utils/logger.js';
import { sendPacket } from '../../utils/packet/packetManager.js';

const loginRequest = async (socket, payload) => {
  try {
    // C2SLoginRequest
    const { id, password } = payload;
    logger.info(`login request id: ${id}`);

    // id가 db에 존재하는지 확인
    const user = await findUserById(id);
    if (!user) {
      throw new CustomErr(
        ERR_CODES.INVALID_CREDENTIALS,
        '아이디 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    // 입력한 비밀번호와 해싱되어 저장된 비밀번호 비교
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new CustomErr(
        ERR_CODES.INVALID_CREDENTIALS,
        '아이디 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    // 현재 로그인 상태 확인
    const alreadyLoginUser = userSessionManager.getUserByUserId(id);
    if (alreadyLoginUser) {
      throw new CustomErr(ERR_CODES.ALREADY_LOGIN, '이미 로그인 되어있는 계정입니다.');
    }

    // 유저 세션에 유저 추가
    userSessionManager.addUser(socket, id);

    // jwt 토큰 발급
    const token = createJWT(id);

    logger.info(`login success id: ${id}`);

    // 패킷 전송
    sendPacket(socket, PACKET_TYPE.LOGIN_RESPONSE, { token });
  } catch (err) {
    handleErr(socket, err);
  }
};

export default loginRequest;
