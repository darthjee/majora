/**
 * Error codes meaning stdout was closed by the reader (for example `majora ... | head`).
 * @type {string[]}
 */
const CLOSED_PIPE_CODES = ['EPIPE', 'ERR_STREAM_DESTROYED'];

/**
 * Writes the CLI results to stdout: JSON only.
 *
 * Objects and pages are pretty-printed with 2 spaces; `--all` streams NDJSON (one compact
 * object per line), consuming the iterator lazily. Writes honour back-pressure. When stdout
 * is closed by the reader, the write throws the stream error, which `isClosedPipe` tells
 * apart so the CLI can stop quietly.
 */
export class OutputWriter {
  #stdout;
  #error = null;

  /**
   * Builds the writer.
   * @param {import('node:stream').Writable} stdout - The output stream.
   */
  constructor(stdout) {
    this.#stdout = stdout;
    // Without a listener, an EPIPE on stdout would crash the process.
    stdout.on('error', (error) => {
      this.#error ??= error;
    });
  }

  /**
   * Tells whether an error means stdout was closed by the reader.
   * @param {unknown} error - Any error.
   * @returns {boolean} `true` for `EPIPE` (and writes to a destroyed stream).
   */
  static isClosedPipe(error) {
    return Boolean(error) && CLOSED_PIPE_CODES.includes(error.code);
  }

  /**
   * Prints one value as pretty JSON (`get`, `create`, `update`, `mine`).
   * @param {unknown} value - The value.
   * @returns {Promise<void>} Resolves once written.
   * @throws {Error} The stream error when stdout fails (see `isClosedPipe`).
   */
  async object(value) {
    await this.#write(`${JSON.stringify(value, null, 2)}\n`);
  }

  /**
   * Prints raw text as is (`--help` and `--version` only; every result is JSON).
   * @param {string} text - The text.
   * @returns {Promise<void>} Resolves once written.
   * @throws {Error} The stream error when stdout fails (see `isClosedPipe`).
   */
  async text(text) {
    await this.#write(text);
  }

  /**
   * Prints a `list` page: its `data` array, or `{ data, page, pages, perPage, total }` with
   * `meta`.
   * @param {import('../core/Page.js').Page} page - The page.
   * @param {object} [options] - Output options.
   * @param {boolean} [options.meta] - Include the page metadata.
   * @returns {Promise<void>} Resolves once written.
   * @throws {Error} The stream error when stdout fails (see `isClosedPipe`).
   */
  async page(page, { meta = false } = {}) {
    const data = page.data || [];

    if (!meta) {
      await this.object(data);
      return;
    }

    const { page: number, pages, perPage, total } = page;

    await this.object({ data, page: number, pages, perPage, total });
  }

  /**
   * Streams every item as NDJSON, one compact JSON line per item; nothing for an empty
   * collection. The iterator is consumed one item at a time, never prefetched.
   * @param {AsyncIterable<unknown>} items - The items (e.g. `wrapper.iterate()`).
   * @returns {Promise<void>} Resolves once every item is written.
   * @throws {Error} The stream error when stdout fails (see `isClosedPipe`).
   */
  async stream(items) {
    for await (const item of items) {
      await this.#write(`${JSON.stringify(item)}\n`);
    }
  }

  /**
   * Writes a chunk, waiting for `drain` when the stream buffer is full.
   * @param {string} text - The chunk.
   * @returns {Promise<void>} Resolves once the stream accepts more data.
   * @throws {Error} The stream error when stdout has failed.
   */
  async #write(text) {
    this.#throwIfFailed();

    const accepted = this.#stdout.write(text, (error) => {
      if (error) {
        this.#error ??= error;
      }
    });

    if (!accepted) {
      await this.#drain();
    }
    this.#throwIfFailed();
  }

  /**
   * Waits until the stream drains, fails or closes.
   * @returns {Promise<void>} Resolves on `drain`, `error` or `close`.
   */
  #drain() {
    const stdout = this.#stdout;
    const events = ['drain', 'error', 'close'];

    return new Promise((resolve) => {
      const finish = () => {
        events.forEach((event) => stdout.off(event, finish));
        resolve();
      };

      events.forEach((event) => stdout.on(event, finish));
    });
  }

  /**
   * Throws the recorded stream error, if any.
   * @throws {Error} The stream error.
   */
  #throwIfFailed() {
    if (this.#error) {
      throw this.#error;
    }
  }
}
