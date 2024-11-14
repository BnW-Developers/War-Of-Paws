import { config } from '../../config/config.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { GlobalFailCode } from '../../init/loadProto.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { validateSignUp } from '../../utils/joi/validateSignUp.js';
import { createResponse } from '../../utils/response/createResponse.js';
import pools from './../../mysql/createPool.js';
import CustomErr from './../../utils/error/customErr.js';
import bcrypt from 'bcrypt';

const registerRequest = async (socket, payload) => {
  const { id, email } = payload;
  let { password } = payload;

  if (validateSignUp(payload)) {
    try {
      // 아이디 중복 확인
      const checkIdSql = 'SELECT COUNT(*) AS count FROM User WHERE user_id = ?';
      const [rows] = await pools.USER_DB.query(checkIdSql, [id]);

      if (rows[0].count > 0) {
        // 아이디 중복인 경우
        const err = new CustomErr(GlobalFailCode.INVALID_REQUEST, 'Duplication ID');
        return handleErr(socket, PACKET_TYPE.REGISTER_RESPONSE, err);
      }
      // 회원가입 전 패스워드 페퍼 및 해싱화
      password = password + config.auth.pepper;

      const hashedPassword = await bcrypt.hash(password, Number(config.auth.salt));

      // 아이디 중복이 아닌 경우, 회원가입 진행
      const sql = 'INSERT INTO User (user_id, password, email) VALUES (?, ?, ?)';
      await pools.USER_DB.query(sql, [id, hashedPassword, email]);

      // 성공 response
      const result = createResponse(PACKET_TYPE.REGISTER_RESPONSE, 1, {
        success: true,
        message: 'Registration completed successfully',
      });

      socket.write(result);
    } catch (err) {
      // DB 관련 에러 리스폰스
      handleErr(socket, PACKET_TYPE.REGISTER_RESPONSE, err);
    }
  } else {
    // 유효성 검사 실패 시
    const err = { code: GlobalFailCode.INVALID_REQUEST, message: 'Validation failed' };
    handleErr(socket, PACKET_TYPE.REGISTER_RESPONSE, err);
  }
};

export default registerRequest;
