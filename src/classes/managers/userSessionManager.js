import User from '../models/user.class.js';

class UserSessionManager {
  constructor() {
    // 싱글톤
    if (UserSessionManager.instance) {
      return UserSessionManager.instance;
    }

    // 새로운 인스턴스 생성
    UserSessionManager.instance = this;

    // 유저 세션 초기화
    this.userSessions = new Map();
  }

  addUser(socket, userId) {
    const user = new User(socket, userId);
    this.userSessions.set(userId, user);
  }

  // userId에 해당하는 유저 세션 삭제하고 성공 여부 반환
  removeUser(userId) {
    return this.userSessions.delete(userId);
  }

  getUserByUserId(userId) {
    return this.userSessions.get(userId);
  }

  getUserBySocket(socket) {
    for (let user of this.userSessions.values()) {
      if (user.socket === socket) {
        return user;
      }
    }
    return null;
  }
}

const userSessionManager = new UserSessionManager();
Object.freeze(userSessionManager); // 인스턴스 변경 방지

export default userSessionManager;
