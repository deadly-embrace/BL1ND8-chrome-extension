class Timer {
  constructor(time, setTime) {
    this.timeLeft = time;
    this.time = 0;
    this.countDown();
    this.setTime = setTime;
  }
  countDown = () => {
    this.id = setInterval(() => {
      if (this.timeLeft <= 0) clearInterval(this.id);
      this.timeLeft -= 1;
      this.time += 1;
      this.setTime(this.time);
    }, 1000);
  };
}

export default Timer;
