import { PACKET_TYPE } from '../../constants/header.js';
import { createUser, findUserById } from '../../mysql/user/user.db.js';
import CustomErr from '../../utils/error/customErr.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { validateSignUp } from '../../utils/joi/validateSignUp.js';
import { createResponse } from '../../utils/response/createResponse.js';

const registerRequest = async (socket, payload) => {
  try {
    // C2SRegisterRequest
    const { id, email, password } = payload;

    // id, email, password가 정해진 형식과 다를 경우 오류
    if (!validateSignUp(payload)) {
      // TODO globalFailCode
      throw new CustomErr(0, '입력한 형식이 올바르지 않습니다.');
    }

    const user = await findUserById(id);
    if (user) {
      // 같은 id를 가진 유저가 이미 존재하는 경우
      throw new CustomErr(0, '이미 존재하는 아이디입니다.');
    }

    // 유저 생성
    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser(id, hashedPassword, email);

    // 응답 전송
    const message = '회원가입을 완료했습니다.';
    const response = createResponse(PACKET_TYPE.REGISTER_RESPONSE, 1, { message });
    socket.write(response);
  } catch (err) {
    handleErr(socket, PACKET_TYPE.REGISTER_REQUEST, err);
  }
};

export default registerRequest;
