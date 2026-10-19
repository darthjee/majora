/**
 * Injectable `fetch` stub for specs: records every call and answers with queued
 * responses, rejections or handlers. Never touches the network or any global.
 */
export class FetchStub {
  constructor() {
    this.calls = [];
    this.queue = [];
    this.fetch = (url, options = {}) => this.handle(url, options);
  }

  /**
   * Queues a response.
   * @param {number} status - HTTP status.
   * @param {unknown} [body] - Object (sent as JSON), string (sent as is) or `null` (empty).
   * @param {object} [headers] - Response headers.
   * @returns {FetchStub} this, for chaining.
   */
  reply(status, body = null, headers = {}) {
    this.queue.push(() => FetchStub.response(status, body, headers));
    return this;
  }

  /**
   * Queues a rejection.
   * @param {Error} error - The rejection reason.
   * @returns {FetchStub} this, for chaining.
   */
  fail(error) {
    this.queue.push(() => Promise.reject(error));
    return this;
  }

  /**
   * Queues a custom handler receiving `(url, options)`.
   * @param {Function} handler - Returns a `Response` or a promise.
   * @returns {FetchStub} this, for chaining.
   */
  handleWith(handler) {
    this.queue.push(handler);
    return this;
  }

  /**
   * Queues a handler that never resolves until its signal aborts.
   * @returns {FetchStub} this, for chaining.
   */
  hang() {
    return this.handleWith((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason));
    }));
  }

  get lastCall() {
    return this.calls[this.calls.length - 1];
  }

  handle(url, options) {
    this.calls.push({ url: String(url), options });
    const next = this.queue.shift();

    if (!next) {
      return Promise.reject(new Error(`FetchStub: unexpected request to ${url}`));
    }

    return Promise.resolve().then(() => next(url, options));
  }

  static response(status, body = null, headers = {}) {
    if (body === null) {
      return new Response(null, { status, headers });
    }
    if (typeof body === 'string') {
      return new Response(body, { status, headers: { 'Content-Type': 'text/html', ...headers } });
    }

    return new Response(JSON.stringify(body), {
      status, headers: { 'Content-Type': 'application/json', ...headers },
    });
  }
}
