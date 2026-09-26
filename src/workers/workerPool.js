const WORKER_FAILURE = 'O worker de chunks falhou';

export class WorkerPool {
  constructor(createWorker, size) {
    this.queue = [];
    this.nextId = 1;
    this.slots = Array.from({ length: size }, () => this.createSlot(createWorker()));
  }

  get queuedCount() {
    return this.queue.length;
  }

  createSlot(worker) {
    const slot = { worker, job: null };
    worker.addEventListener('message', (event) => this.complete(slot, event.data));
    worker.addEventListener('error', (event) => this.crash(slot, event));
    return slot;
  }

  run(job) {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...job, resolve, reject });
      this.dispatch();
    });
  }

  dispatch() {
    this.slots.filter((slot) => slot.job === null).forEach((slot) => {
      const job = this.takeNextJob();
      if (job === null) return;
      const { request, transfer } = job.build();
      slot.job = { ...job, id: this.nextId++ };
      slot.worker.postMessage({ id: slot.job.id, request }, transfer);
    });
  }

  takeNextJob() {
    this.queue = this.queue.filter((job) => {
      if (!job.isStale()) return true;
      job.resolve(null);
      return false;
    });
    if (this.queue.length === 0) return null;
    const priorities = this.queue.map((job) => job.priority());
    const index = priorities.indexOf(Math.min(...priorities));
    return this.queue.splice(index, 1)[0];
  }

  complete(slot, message) {
    const { job } = slot;
    if (job === null || message.id !== job.id) return;
    slot.job = null;
    if (message.error === undefined) job.resolve(message.result);
    else job.reject(new Error(message.error));
    this.dispatch();
  }

  crash(slot, event) {
    const { job } = slot;
    slot.job = null;
    if (job !== null) job.reject(new Error(event.message || WORKER_FAILURE));
    this.dispatch();
  }
}
