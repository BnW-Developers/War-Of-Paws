import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import userSessionManager from '../classes/managers/userSessionManager.js';
import gameSessionManager from '../classes/managers/gameSessionManager.js';
import CustomErr from '../utils/error/customErr.js';

const router = express.Router();

router.post('/gameSession', authMiddleware, async (req, res, next) => {
  try {
    const { users } = req.body;
    if (users.length !== 2) throw new CustomErr(400, '인자 확인 할 것');
    // 게임세션 생성
    const game = gameSessionManager.addGameSession();
    const gameId = game.getGameId();

    // 유저세션 생성 후 동물종류 및 게임세션 ID 삽입
    for (const { userId, species } of users) {
      const user = userSessionManager.addUser(null, userId);
      user.setCurrentSpecies(species);
      user.setCurrentGameId(gameId);
      console.log(
        `유저 생성 완료 : ${user.getUserId()},${user.getCurrentGameId()}, ${user.getCurrentSpecies()}`,
      );
    }

    return res.status(200).json({ message: 'OK' });
  } catch (err) {
    next(err); // 에러 발생 시 다음 미들웨어로 에러 전달
  }
});

export default router;
