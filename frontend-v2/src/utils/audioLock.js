// Lock para manejar la reproducción de audio de manera exclusiva
class AudioLock {
  constructor() {
    this.locked = false;
    this.waitQueue = [];
  }

  async acquire() {
    if (!this.locked) {
      this.locked = true;
      return true;
    }

    return new Promise(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  release() {
    if (this.waitQueue.length > 0) {
      const nextResolve = this.waitQueue.shift();
      nextResolve(true);
    } else {
      this.locked = false;
    }
  }
}

export default AudioLock;