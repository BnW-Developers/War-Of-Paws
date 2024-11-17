import { uuid } from '../../utils/util/uuid';

class CheckPoint {
  #usersA;
  #usersB;
  #status;
  constructor(playerSocketA, playerSocketB) {
    this.id = uuid();
    this.playerSockets = [playerSocketA, playerSocketB];
    this.#usersA = [];
    this.#usersB = [];
    this.#status = 'waiting';
    this.timer = null;
    this.checkManager = null;
  }

  modifyUser(team, user, action) {
    const array = team === 'A' ? this.#usersA : this.#usersB;

    switch (action) {
      case 'add':
        if (this.#status === 'waiting') this.attemptedOccupation(team);

        array.push(user);
        break;
      case 'remove':
        array.splice(array.indexOf(user), 1);
        break;
      default:
        console.error('action값 확인하세요.');
        break;
    }
  }

  checkStatus(team) {
    switch (this.#status) {
      case 'waiting':
        this.attemptedOccupation(team);
        break;
      case 'attempting':
        this.pauseOccupation();
        break;
      case 'A':
        this.resumeOccupation();
        break;
      case 'B':
      default:
        console.error('status값 확인하세요.');
        break;
    }
  }

  occupation(team) {
    this.setStatus(team);
    this.deleteCheckManager();
  }

  attemptedOccupation(team) {
    this.#status = `attempting${team}`;
  }

  pauseOccupation() {
    this.timer.pause();
  }

  resumeOccupation() {
    this.timer.resume();
  }

  clearOccupation() {
    this.timer.clear();
  }

  getUsersCount(team) {
    return team === 'A' ? this.#usersA.length : this.#usersB.length;
  }

  getStatus() {
    return this.#status;
  }

  setStatus(team) {
    if (this.#status === team || !(team === 'A' || team === 'B')) return;
    this.#status = team;
  }

  addCheckManager() {
    this.checkManager = setInterval(checkManager, 100);
  }

  deleteCheckManager() {
    clearInterval(this.checkManager);
    this.checkManager = null;
  }

  checkManager() {
    if (this.#usersA.length === 0 && this.#usersB.length === 0) {
      this.clearOccupation();
    }
  }
}

export default CheckPoint;
