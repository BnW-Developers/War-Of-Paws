import Timer from '../utils/Timer.class.js';

class CheckPoint {
  #users;
  #status;
  currentStatus;

  constructor(name) {
    this.name = name;
    this.#users = [[], []]; // 0: 팀 A, 1: 팀 B
    this.#status = 'waiting';
    this.currentStatus = this.#status;
    this.timer = new Timer(5000, this.completeOccupation.bind(this)); // 10초 타이머
  }

  modifyUnit(team, unit, action) {
    const array = this.#users[team];

    switch (action) {
      case 'add':
        array.push(unit);
        this.checkStatus(team);
        break;
      case 'remove':
        array.splice(array.indexOf(unit), 1);
        this.checkStatus(team);
        break;
      default:
        break;
    }
  }

  checkStatus(team) {
    const myUnits = this.getUsersCount(team);
    const opponentUnits = this.getUsersCount(1 - team);
    const timerStatus = this.timer.status;

    // Define a map for handling each status
    const actions = {
      waiting: () => {
        if (myUnits) this.attemptedOccupation(team);
      },
      [`occupied${team}`]: () => {
        if (!myUnits && opponentUnits) this.attemptedOccupation(1 - team);
      },
      [`occupied${1 - team}`]: () => {
        if (myUnits && !opponentUnits) this.attemptedOccupation(team);
      },
      [`attempting${team}`]: () => {
        this.handleAttempt(opponentUnits, myUnits, timerStatus);
      },
      [`attempting${1 - team}`]: () => {
        this.handleAttempt(myUnits, opponentUnits, timerStatus);
      },
    };

    const action = actions[this.#status];
    if (action) action();
  }

  handleAttempt(opponentUnits, myUnits, timerStatus) {
    if (opponentUnits && timerStatus) {
      this.pauseOccupation();
    } else if (!opponentUnits && !timerStatus) {
      this.resumeOccupation();
    } else if (!myUnits) {
      this.clearOccupation();
      this.#status = this.currentStatus;
    }
  }

  getUsersCount(team) {
    return this.#users[team].length;
  }

  attemptedOccupation(team) {
    this.#status = `attempting${team}`;
    console.log(`${team} 팀 ${this.name}점령시도중 현재 상태: ${this.#status}`);
    this.timer.start();
    // TODO: 점령 시도 패킷 전송
  }

  clearOccupation() {
    this.#status = this.currentStatus;
    console.log(`${this.name}점령초기화 현재 상태: ${this.#status}`);
    this.timer.allClear();
    // TODO: 점령 타이머 초기화 패킷 전송
  }
  pauseOccupation() {
    console.log(`${this.name}점령일시정지 현재 상태: ${this.#status}`);
    this.timer.pause();
    // TODO: 점령 일시정지 패킷 전송
  }
  resumeOccupation() {
    console.log(`${this.name}점령재개 현재 상태: ${this.#status}`);
    this.timer.resume();
    // TODO: 점령 재개 패킷 전송
  }

  completeOccupation() {
    this.#status = `occupied${this.#status.replace('attempting', '')}`;
    console.log(`${this.name}점령완료 현재 상태: ${this.#status}`);
    this.currentStatus = this.#status;
    this.timer.allClear();
    // TODO: 점령완료 패킷 전송
  }
}

export default CheckPoint;
