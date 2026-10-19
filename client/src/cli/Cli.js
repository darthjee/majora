import { readFile as fsReadFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { MajoraClient } from '../MajoraClient.js';
import { ConfigurationError } from '../core/errors/ConfigurationError.js';
import { ValidationError } from '../core/errors/ValidationError.js';
import { ArgumentParser } from './ArgumentParser.js';
import { BodyReader } from './BodyReader.js';
import { CommandRegistry } from './CommandRegistry.js';
import { ExitCodes } from './ExitCodes.js';
import { HelpText } from './HelpText.js';
import { OutputWriter } from './OutputWriter.js';

/**
 * Replacement for any secret found in what the CLI writes to stderr.
 * @type {string}
 */
const REDACTED = '[REDACTED]';

/**
 * Reads the package version.
 * @returns {string} The `version` of `client/package.json`.
 */
function packageVersion() {
  return createRequire(import.meta.url)('../../package.json').version;
}

/**
 * Yields the items of an iterable until the signal aborts, so `--all` stops between items
 * on SIGINT instead of printing the rest of the current page.
 * @param {AsyncIterable<unknown>} items - The items.
 * @param {AbortSignal} signal - The abort signal.
 * @yields {unknown} Each item.
 * @returns {AsyncGenerator<unknown>} The items.
 */
async function* untilAborted(items, signal) {
  for await (const item of items) {
    signal.throwIfAborted();
    yield item;
  }
}

/**
 * The `majora` command-line tool: parses `argv`, calls one library method and prints JSON.
 *
 * Every io is injected (`env`, `stdin`, `stdout`, `stderr`, `fetch`, `readFile`, `signal`),
 * so specs need no globals. `run` never throws: it returns the exit code. The token is
 * never printed: stderr output is redacted defensively.
 */
export class Cli {
  #env;
  #stdin;
  #stdout;
  #stderr;
  #fetch;
  #readFile;
  #controller = new AbortController();
  #signal;
  #secrets = [];

  /**
   * Builds the CLI.
   * @param {object} io - The injected io.
   * @param {object} [io.env] - Environment variables (default `{}`).
   * @param {AsyncIterable<Buffer|string>} [io.stdin] - Read for `--data -`.
   * @param {import('node:stream').Writable} io.stdout - JSON output.
   * @param {import('node:stream').Writable} io.stderr - Error output.
   * @param {Function} [io.fetch] - Fetch implementation (default `globalThis.fetch`).
   * @param {Function} [io.readFile] - `(path, encoding) => Promise<string>`, for
   *   `--token-file` and `--data @file` (default `fs/promises.readFile`).
   * @param {AbortSignal} [io.signal] - Aborts the in-flight request (exit 130).
   */
  constructor({ env = {}, stdin, stdout, stderr, fetch, readFile = fsReadFile, signal } = {}) {
    this.#env = env || {};
    this.#stdin = stdin;
    this.#stdout = stdout;
    this.#stderr = stderr;
    this.#fetch = fetch;
    this.#readFile = readFile;
    this.#signal = signal
      ? AbortSignal.any([this.#controller.signal, signal])
      : this.#controller.signal;
    this.#addSecret(this.#env.MAJORA_TOKEN);
  }

  /**
   * Aborts the in-flight request (for SIGINT); `run` then returns 130.
   */
  abort() {
    this.#controller.abort();
  }

  /**
   * Runs one command.
   * @param {string[]} argv - The arguments, without `node` and the script.
   * @returns {Promise<number>} The exit code.
   */
  async run(argv) {
    let debug = argv.includes('--debug');

    try {
      const command = new ArgumentParser({ env: this.#env }).parse(argv);

      debug = command.options.debug;
      await this.#execute(command);

      return ExitCodes.SUCCESS;
    } catch (error) {
      return this.#fail(error, debug);
    }
  }

  /**
   * Executes a parsed command.
   * @param {object} command - The `ArgumentParser` result.
   * @returns {Promise<void>} Resolves once the output is written.
   */
  async #execute(command) {
    const writer = new OutputWriter(this.#stdout);

    if (command.help) {
      await writer.text(command.resource ? HelpText.resource(command.resource) : HelpText.global());
      return;
    }
    if (command.version) {
      await writer.text(`${packageVersion()}\n`);
      return;
    }

    const client = await this.#client(command.options);
    const wrapper = CommandRegistry.wrapper(command.resource, client, command.options.game);

    await this.#dispatch(wrapper, command, writer);
  }

  /**
   * Builds the client from the flags and the environment.
   * @param {object} options - The parsed options.
   * @returns {Promise<MajoraClient>} The client.
   * @throws {ConfigurationError} When the configuration is missing or invalid.
   */
  async #client(options) {
    const token = options.tokenFile === undefined
      ? undefined
      : await this.#tokenFromFile(options.tokenFile);

    return new MajoraClient({
      baseUrl: options.url,
      token,
      timeout: options.timeout,
      retries: options.retries,
      fetch: this.#fetch,
      allowInsecureHttp: options.allowInsecureHttp,
      env: this.#env,
    });
  }

  /**
   * Reads the token from a `--token-file` (whitespace trimmed).
   * @param {string} path - The file path.
   * @returns {Promise<string>} The token.
   * @throws {ConfigurationError} When the file cannot be read or is blank.
   */
  async #tokenFromFile(path) {
    let content;

    try {
      content = await this.#readFile(path, 'utf8');
    } catch (error) {
      throw new ConfigurationError(`Cannot read --token-file ${path} (${error.code || 'read error'})`);
    }

    const token = String(content).trim();

    if (token.length === 0) {
      throw new ConfigurationError(`--token-file ${path} is empty`);
    }
    this.#addSecret(token);

    return token;
  }

  /**
   * Calls the library action and prints its result.
   * @param {object} wrapper - The library wrapper.
   * @param {object} command - The parsed command.
   * @param {OutputWriter} writer - The output writer.
   * @returns {Promise<void>} Resolves once the output is written.
   */
  async #dispatch(wrapper, command, writer) {
    const { action, id, options } = command;
    const { restricted, query } = options;
    const request = { restricted, query, signal: this.#signal };

    switch (action) {
      case 'list':
        return this.#list(wrapper, options, request, writer);
      case 'mine':
        return writer.object(await wrapper.mine(request));
      case 'get':
        return writer.object(await wrapper.get(id, request));
      case 'create':
        return writer.object(await wrapper.create(await this.#body(options), request));
      default:
        return writer.object(await wrapper.update(id, await this.#body(options), request));
    }
  }

  /**
   * Prints one page, or streams every item with `--all`.
   * @param {object} wrapper - The library wrapper.
   * @param {object} options - The parsed options.
   * @param {object} request - The request options (`restricted`, `query`, `signal`).
   * @param {OutputWriter} writer - The output writer.
   * @returns {Promise<void>} Resolves once the output is written.
   */
  async #list(wrapper, options, request, writer) {
    const listOptions = { ...request, perPage: options.perPage };

    if (options.all) {
      await writer.stream(untilAborted(wrapper.iterate(listOptions), this.#signal));
      return;
    }

    await writer.page(await wrapper.list({ ...listOptions, page: options.page }), {
      meta: options.meta,
    });
  }

  /**
   * Reads the `--data` body.
   * @param {object} options - The parsed options.
   * @returns {Promise<object>} The body.
   */
  #body(options) {
    return new BodyReader({ stdin: this.#stdin, readFile: this.#readFile }).read(options.data);
  }

  /**
   * Reports an error on stderr and returns its exit code.
   * @param {unknown} error - The error.
   * @param {boolean} debug - Whether to print the stack trace.
   * @returns {number} The exit code.
   */
  #fail(error, debug) {
    if (this.#signal.aborted) {
      return ExitCodes.INTERRUPTED;
    }
    if (OutputWriter.isClosedPipe(error)) {
      return ExitCodes.SUCCESS;
    }

    const message = error instanceof Error ? error.message : String(error);
    const lines = [message];

    if (error instanceof ValidationError) {
      lines.push(JSON.stringify(error.fields));
    }
    if (debug && error instanceof Error && error.stack) {
      lines.push(error.stack);
    }
    this.#writeError(lines);

    return ExitCodes.for(error);
  }

  /**
   * Writes lines to stderr, redacting every known secret.
   * @param {string[]} lines - The lines.
   */
  #writeError(lines) {
    const text = lines.map((line) => this.#redact(line)).join('\n');

    try {
      this.#stderr.write(`${text}\n`);
    } catch {
      // stderr is gone: nothing left to report to.
    }
  }

  /**
   * Replaces every known secret in a text.
   * @param {string} text - The text.
   * @returns {string} The redacted text.
   */
  #redact(text) {
    return this.#secrets.reduce((result, secret) => result.split(secret).join(REDACTED), String(text));
  }

  /**
   * Records a secret to redact from stderr.
   * @param {unknown} secret - The secret (ignored when blank).
   */
  #addSecret(secret) {
    if (typeof secret === 'string' && secret.trim() !== '') {
      this.#secrets.push(secret.trim());
    }
  }
}
