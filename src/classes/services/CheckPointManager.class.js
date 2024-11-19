import CheckPoint from '../models/CheckPoint.class.js';

class CheckPointManager {
  #topPoint;
  #bottomPoint;
  constructor() {
    this.#topPoint = new CheckPoint('top');
    this.#bottomPoint = new CheckPoint('bottom');
  }
  addUnit(isTop, team, unit) {
    const checkPoint = isTop ? this.#topPoint : this.#bottomPoint;
    checkPoint.modifyUnit(team, unit, 'add');
  }

  removeUnit(isTop, team, unit) {
    const checkPoint = isTop ? this.#topPoint : this.#bottomPoint;
    checkPoint.modifyUnit(team, unit, 'remove');
  }
}

export default CheckPointManager;
