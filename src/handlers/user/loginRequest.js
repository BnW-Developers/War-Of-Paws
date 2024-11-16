import { PACKET_TYPE } from '../../constants/header.js';
import { findUserById } from '../../mysql/user/user.db.js';
import CustomErr from '../../utils/error/customErr.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { createJWT } from '../../utils/jwt/createToken.js';
import { createResponse } from '../../utils/response/createResponse.js';

const loginRequest = async (socket, payload) => {
  try {
    const { id, password } = payload;

    // id가 db에 존재하는지 확인
    const user = await findUserById(id);
    if (!user) {
      // TODO GlobalFailCode
      throw new CustomErr(0, '아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    // 입력한 비밀번호와 해싱되어 저장된 비밀번호 비교
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // TODO GlobalFailCode
      throw new CustomErr(0, '아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    // TODO 현재 로그인 상태 확인
    // TODO 유저 세션에 유저 추가 + redis 활용

    // jwt 토큰 발급... 은 했는데 proto에 없네?
    const token = createJWT(id);

    // 응답 전송
    const message = '로그인에 성공했습니다.';
    const response = createResponse(PACKET_TYPE.LOGIN_RESPONSE, 1, { message });
    socket.write(response);
  } catch (err) {
    handleErr(socket, PACKET_TYPE.LOGIN_REQUEST, err);
  }
};

export default loginRequest;
