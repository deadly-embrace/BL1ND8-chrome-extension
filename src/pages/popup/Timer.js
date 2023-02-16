class Timer {
  constructor(time, setTimer) {
    this.timeLeft = time;
    this.time = 0;
    this.setTimer = setTimer;
    this.countDown();
  }
  countDown = () => {
    this.id = setInterval(() => {
      if (this.timeLeft <= 0) clearInterval(this.id);
      this.timeLeft -= 1;
      this.time += 1;
      this.setTimer({ time: this.time, id: this.id });
    }, 1000);
  };
}

export default Timer;
