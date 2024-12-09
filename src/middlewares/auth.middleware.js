import { checkHashed } from '../utils/auth/checkHashed.js';
import CustomErr from '../utils/error/customErr.js';

export default async function (req, _, next) {
  try {
    const { authorization } = req.headers; // 헤더에서 토큰 정보 추출

    if (!authorization)
      // 토큰이 없을 시 에러
      throw new CustomErr('요청한 사용자의 API-KEY가 없습니다.', 401);

    if (!(await checkHashed(authorization)))
      // 지정된 키와 다를 경우
      throw new CustomErr('일치하지 않은 API-KEY 정보입니다.', 401);

    next(); // 다음 미들웨어로 전달
  } catch (err) {
    next(err);
  }
}
