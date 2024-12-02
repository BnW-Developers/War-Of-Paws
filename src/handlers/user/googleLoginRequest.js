import userSessionManager from './../../classes/managers/userSessionManager.js';
import CustomErr from './../../utils/error/customErr.js';
import { createJWT } from './../../utils/jwt/createToken.js';
import { sendPacket } from './../../utils/packet/packetManager.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { handleErr } from '../../utils/error/handlerErr.js';
import { findOrCreateUserByGoogleId } from '../../mysql/user/user.db.js';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config/config.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import logger from '../../utils/logger.js';

// 구글 OAuth 클라이언트 초기화
const googleOAuthClient = new OAuth2Client(config.googleApi.clientId);

// TCP 서버의 로그인 핸들러
const googleLoginRequest = async (socket, payload) => {
  try {
    // C2SGoogleLoginRequest
    const { idToken, name, email } = payload;
    logger.info(`Google login request for email: ${email}`);

    // 1. 구글 ID 토큰 검증
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: idToken,
      audience: config.googleApi.clientId, // 애플리케이션의 클라이언트 ID
    });

    // 2. 토큰에서 구글 ID 추출
    const googlePayload = ticket.getPayload();
    const googleId = googlePayload['sub']; // 구글의 고유 사용자 ID

    // 3. 토큰의 정보와 클라이언트가 보낸 정보 비교
    if (googlePayload['email'] !== email || googlePayload['name'] !== name) {
      throw new CustomErr(ERR_CODES.INVALID_GOOGLE_TOKEN, '토큰 정보와 일치하지 않습니다.');
    }

    // 4. 토큰 만료 및 발급 시간 추가 검증
    const currentTime = Math.floor(Date.now() / 1000);
    if (googlePayload['exp'] < currentTime || googlePayload['iat'] > currentTime) {
      throw new CustomErr(ERR_CODES.EXPIRED_GOOGLE_TOKEN, '만료되었거나 유효하지 않은 토큰입니다.');
    }

    // 구글 아이디로 로그인 한 유저 검색 / 없으면 저장
    const user = await findOrCreateUserByGoogleId(googleId, email, name);

    // 현재 로그인 상태 확인
    const alreadyLoginUser = userSessionManager.getUserByUserId(googleId);
    if (alreadyLoginUser) {
      throw new CustomErr(ERR_CODES.ALREADY_LOGIN, '이미 로그인 되어있는 계정입니다.');
    }

    // 유저 세션에 유저 추가
    userSessionManager.addUser(socket, googleId);

    // jwt 토큰 발급
    const token = createJWT(googleId);

    logger.info(`Google login success for ID: ${email}`);

    // 패킷 전송
    sendPacket(socket, PACKET_TYPE.GOOGLE_LOGIN_RESPONSE, {
      token,
    });
  } catch (error) {
    // 에러 처리
    handleErr(socket, error);
  }
};

export default googleLoginRequest;
