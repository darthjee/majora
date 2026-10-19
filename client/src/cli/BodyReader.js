import { readFile as fsReadFile } from 'node:fs/promises';
import { UsageError } from '../core/errors/UsageError.js';

/**
 * Tells whether a parsed value is a plain JSON object (not an array, `null` or a scalar).
 * @param {unknown} value - The parsed value.
 * @returns {boolean} `true` for a JSON object.
 */
function isJsonObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reads every chunk of a readable stream as one UTF-8 string.
 * @param {AsyncIterable<Buffer|string>} stream - The stream (e.g. stdin).
 * @returns {Promise<string>} The text.
 */
async function readAll(stream) {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Resolves the `--data` flag into the body of a `create` / `update`, following the curl
 * convention: `-` reads stdin, `@<path>` reads a file, anything else is inline JSON.
 *
 * The body must be a JSON object. Invalid JSON, a non-object or an unreadable file throws
 * `UsageError`; the messages never echo the body or the file contents.
 */
export class BodyReader {
  #stdin;
  #readFile;

  /**
   * Builds the reader.
   * @param {object} [options] - Reader options.
   * @param {AsyncIterable<Buffer|string>} [options.stdin] - Stream read for `--data -`.
   * @param {Function} [options.readFile] - `(path, encoding) => Promise<string>` (default
   *   `fs/promises.readFile`).
   */
  constructor({ stdin, readFile = fsReadFile } = {}) {
    this.#stdin = stdin;
    this.#readFile = readFile;
  }

  /**
   * Reads and parses the body.
   * @param {string} data - The raw `--data` value.
   * @returns {Promise<object>} The parsed JSON object.
   * @throws {UsageError} When the source cannot be read, or is not a JSON object.
   */
  async read(data) {
    const { text, source } = await this.#text(data);

    return BodyReader.parse(text, source);
  }

  /**
   * Parses a JSON text that must hold an object.
   * @param {string} text - The JSON text.
   * @param {string} [source] - Where it came from, for the error message.
   * @returns {object} The parsed object.
   * @throws {UsageError} When the text is not valid JSON or not an object.
   */
  static parse(text, source = 'inline --data') {
    let value;

    try {
      value = JSON.parse(text);
    } catch {
      throw new UsageError(`Invalid --data: ${source} is not valid JSON`);
    }

    if (!isJsonObject(value)) {
      throw new UsageError(`Invalid --data: ${source} must be a JSON object`);
    }

    return value;
  }

  /**
   * Reads the raw text of the body from its source.
   * @param {string} data - The raw `--data` value.
   * @returns {Promise<{text: string, source: string}>} The text and a description of its
   *   source.
   * @throws {UsageError} When the source cannot be read.
   */
  async #text(data) {
    if (data === '-') {
      return { text: await this.#readStdin(), source: 'stdin' };
    }
    if (data.startsWith('@')) {
      const path = data.slice(1);

      return { text: await this.#readPath(path), source: `file ${path}` };
    }

    return { text: data, source: 'inline --data' };
  }

  /**
   * Reads all of stdin.
   * @returns {Promise<string>} The text.
   * @throws {UsageError} When no stdin is available or reading fails.
   */
  async #readStdin() {
    if (!this.#stdin) {
      throw new UsageError('Invalid --data: stdin is not available');
    }

    try {
      return await readAll(this.#stdin);
    } catch (error) {
      throw new UsageError(`Invalid --data: cannot read stdin (${error.code || 'read error'})`);
    }
  }

  /**
   * Reads a `--data @<path>` file.
   * @param {string} path - The file path.
   * @returns {Promise<string>} The file contents.
   * @throws {UsageError} When the path is empty or the file cannot be read.
   */
  async #readPath(path) {
    if (path === '') {
      throw new UsageError('Invalid --data: missing file path after @');
    }

    try {
      return await this.#readFile(path, 'utf8');
    } catch (error) {
      throw new UsageError(`Invalid --data: cannot read file ${path} (${error.code || 'read error'})`);
    }
  }
}
