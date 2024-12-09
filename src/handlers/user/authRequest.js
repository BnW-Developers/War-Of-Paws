import gameSessionManager from '../../classes/managers/gameSessionManager.js';
import userSessionManager from '../../classes/managers/userSessionManager.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomErr from '../../utils/error/customErr.js';
import { ERR_CODES } from '../../utils/error/errCodes.js';
import { handleErr } from '../../utils/error/handlerErr.js';

const authRequest = (socket, payload) => {
  try {
    const { userId } = payload;

    // 유닛 아이디 정보가 유저세션에 있는지 확인
    const user = userSessionManager.getUserByUserId(userId);
    if (!user) throw new CustomErr(ERR_CODES.USER_SESSION_NOT_FOUND, '인가되지 않은 아이디입니다.');

    // 인증상태 플래그 변경
    socket.isAuthenticated = true;

    // 유저 정보에 소켓 등록
    user.setSocket(socket);

    // 있으면 게임세션 참가시킴
    const gameId = user.getCurrentGameId();
    const game = gameSessionManager.getGameSessionByGameId(gameId);
    game.addUser(user);

    // 패킷 전송
    // sendPacket(socket, PACKET_TYPE.ENEMY_UNIT_ANIMATION_NOTIFICATION, {
    //   unitId,
    //   animationId,
    // });
  } catch (err) {
    handleErr(socket, err);
  }
};

export default authRequest;
