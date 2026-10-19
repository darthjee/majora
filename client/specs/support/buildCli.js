import { Cli } from '../../src/cli/Cli.js';
import { FakeWritable } from './FakeStreams.js';
import { FetchStub } from './FetchStub.js';

export const CLI_URL = 'https://majora.example.com';
export const CLI_TOKEN = 'mjr_secret_token_value';

/**
 * Builds a `Cli` on fake io: a `FetchStub`, fake stdout / stderr and an env holding the URL
 * and a recognizable token.
 * @param {object} [options] - Overrides.
 * @param {object} [options.env] - Extra environment variables.
 * @param {object} [options.stdin] - The stdin stream.
 * @param {Function} [options.readFile] - The `readFile` stub.
 * @param {AbortSignal} [options.signal] - The injected signal.
 * @returns {{cli: Cli, stub: FetchStub, stdout: FakeWritable, stderr: FakeWritable,
 *   run: Function}} The CLI and its io.
 */
export function buildCli({ env = {}, stdin, readFile, signal } = {}) {
  const stub = new FetchStub();
  const stdout = new FakeWritable();
  const stderr = new FakeWritable();
  const cli = new Cli({
    env: { MAJORA_URL: CLI_URL, MAJORA_TOKEN: CLI_TOKEN, ...env },
    stdin,
    stdout,
    stderr,
    fetch: stub.fetch,
    readFile,
    signal,
  });

  return { cli, stub, stdout, stderr, run: (...argv) => cli.run(argv) };
}

/**
 * Asserts that no captured stream contains the token.
 * @param {...FakeWritable} streams - The captured streams.
 */
export function expectNoToken(...streams) {
  streams.forEach((stream) => {
    expect(stream.output).not.toContain(CLI_TOKEN);
    expect(stream.output).not.toContain('secret_token_value');
  });
}
