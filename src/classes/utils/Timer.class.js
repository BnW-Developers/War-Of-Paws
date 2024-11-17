class Timer {
  constructor(duration, callback) {
    this.duration = duration;
    this.remainingTime = duration;
    this.callback = callback;
    this.timer = null;
    this.startTime = null;
  }

  start() {
    if (this.timer !== null) return;
    this.startTime = Date.now();
    this.timer = setTimeout(() => {
      this.callback();
      this.clear();
    }, this.remainingTime);
  }

  pause() {
    if (!this.timer) return;
    this.clear();
    this.remainingTime -= Date.now() - this.startTime;
  }

  resume() {
    if (this.timer || this.remainingTime <= 0) return;
    this.start();
  }

  clear() {
    clearTimeout(this.timer);
    this.timer = null;
  }
}
