import CheckPoint from '../models/checkPoint.class.js';

class PointManager {
  #pointA;
  #pointB;
  constructor(playerSocketA, playerSocketB) {
    this.#pointA = new CheckPoint(playerSocketA, playerSocketB);
    this.#pointB = new CheckPoint(playerSocketA, playerSocketB);
    this.points = [this.#pointA.id, this.#pointB.id];
  }

  getCheckPointIds() {
    return [...this.points];
  }

  addUser(checkPointId, team, user) {
    const checkPoint = this.points.indexOf(checkPointId) === 0 ? this.#pointA : this.#pointB;
    checkPoint.modifyUser(team, user, 'add');
  }
}

export default PointManager;
