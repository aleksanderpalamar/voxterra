export class InlineExecutor {
  constructor(handle) {
    this.handle = handle;
  }

  run(job) {
    if (job.isStale()) return Promise.resolve(null);
    try {
      const { request } = job.build();
      return Promise.resolve(this.handle(request).result);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
