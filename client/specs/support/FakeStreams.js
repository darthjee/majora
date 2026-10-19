import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';

/**
 * Fake writable stream for specs: records every chunk, can simulate back-pressure and a
 * closed pipe (`EPIPE`).
 */
export class FakeWritable extends EventEmitter {
  constructor() {
    super();
    this.chunks = [];
    this.full = false;
    this.failAfter = null;
  }

  /**
   * Makes `write` return `false` and emit `drain` on the next macrotask.
   * @returns {FakeWritable} this, for chaining.
   */
  withBackPressure() {
    this.full = true;
    return this;
  }

  /**
   * Makes every write after the first `count` ones fail with `EPIPE`.
   * @param {number} count - The number of successful writes.
   * @returns {FakeWritable} this, for chaining.
   */
  closeAfter(count) {
    this.failAfter = count;
    return this;
  }

  write(chunk, callback) {
    if (this.failAfter !== null && this.chunks.length >= this.failAfter) {
      const error = Object.assign(new Error('write EPIPE'), { code: 'EPIPE' });

      setImmediate(() => {
        callback?.(error);
        this.emit('error', error);
      });
      return false;
    }

    this.chunks.push(String(chunk));
    setImmediate(() => callback?.());

    if (this.full) {
      setImmediate(() => this.emit('drain'));
      return false;
    }

    return true;
  }

  get output() {
    return this.chunks.join('');
  }
}

/**
 * Builds a readable stream yielding the given text, as stdin.
 * @param {string} text - The text.
 * @returns {Readable} The stream.
 */
export function fakeStdin(text) {
  return Readable.from([Buffer.from(text)]);
}
