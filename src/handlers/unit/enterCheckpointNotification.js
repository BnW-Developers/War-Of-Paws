import checkSessionInfo from '../../utils/sessions/checkSessionInfo.js';

const enterCheckpointNotification = (socket, payload) => {
  const { isTop, unitId } = payload;

  const { gameSession } = checkSessionInfo(socket);
  //메서드 실행
  gameSession.addUnit(isTop, unitId);
};

export default enterCheckpointNotification;
