class Timer {
  constructor(duration, callback) {
    this.duration = duration;
    this.remainingTime = duration;
    this.callback = callback;
    this.timer = null;
    this.startTime = null;
    this.status = false;
  }

  start() {
    if (this.timer !== null) return;
    this.startTime = Date.now();
    this.timer = setTimeout(() => {
      this.callback();
      this.clear();
    }, this.remainingTime);
    this.status = true;
  }

  pause() {
    if (!this.timer) return;
    this.clear();
    this.remainingTime -= Date.now() - this.startTime;
    this.status = false;
  }

  resume() {
    if (this.timer || this.remainingTime <= 0) return;
    this.start();
    this.status = true;
  }

  clear() {
    clearTimeout(this.timer);
    this.timer = null;
    this.status = false;
  }
}

export default Timer;
