import { CLI_TOKEN, buildCli, expectNoToken } from '../support/buildCli.js';
import { pageHeaders } from '../support/buildCore.js';
import { fakeStdin } from '../support/FakeStreams.js';

describe('Cli token handling', () => {
  const FILE_TOKEN = 'mjr_secret_token_value_from_file';
  let readFile;
  let io;

  beforeEach(() => {
    readFile = jasmine.createSpy('readFile').and.callFake(async (path) => {
      if (path === '/run/token') {
        return `  ${FILE_TOKEN}\n`;
      }
      if (path === '/run/blank') {
        return ' \n';
      }
      throw Object.assign(new Error(`ENOENT: ${path}`), { code: 'ENOENT' });
    });
    io = buildCli({ readFile, stdin: fakeStdin(`{"token":"${CLI_TOKEN}"}`) });
  });

  afterEach(() => {
    expectNoToken(io.stdout, io.stderr);
    expect(io.stderr.output).not.toContain(FILE_TOKEN);
  });

  describe('--token-file', () => {
    it('reads the trimmed token and overrides MAJORA_TOKEN', async () => {
      io.stub.reply(200, []);

      expect(await io.run('games', 'mine', '--token-file', '/run/token')).toEqual(0);
      expect(readFile).toHaveBeenCalledWith('/run/token', 'utf8');
      expect(io.stub.lastCall.options.headers.Authorization).toEqual(`Bearer ${FILE_TOKEN}`);
    });

    it('works without MAJORA_TOKEN', async () => {
      io = buildCli({ readFile, env: { MAJORA_TOKEN: undefined } });
      io.stub.reply(200, []);

      expect(await io.run('games', 'mine', '--token-file', '/run/token')).toEqual(0);
    });

    it('exits 2 on a missing file', async () => {
      expect(await io.run('games', 'mine', '--token-file', '/run/missing')).toEqual(2);
      expect(io.stderr.output).toEqual('Cannot read --token-file /run/missing (ENOENT)\n');
      expect(io.stub.calls).toEqual([]);
    });

    it('exits 2 on a read error without code', async () => {
      readFile.and.rejectWith(new Error('boom'));

      expect(await io.run('games', 'mine', '--token-file', '/run/token')).toEqual(2);
      expect(io.stderr.output).toEqual('Cannot read --token-file /run/token (read error)\n');
    });

    it('exits 2 on a blank file instead of falling back to MAJORA_TOKEN', async () => {
      expect(await io.run('games', 'mine', '--token-file', '/run/blank')).toEqual(2);
      expect(io.stderr.output).toEqual('--token-file /run/blank is empty\n');
      expect(io.stub.calls).toEqual([]);
    });

    it('redacts the file token from errors', async () => {
      io.stub.reply(400, { errors: { token: [FILE_TOKEN] } });

      expect(await io.run('npcs', 'create', '--game', 'g', '--data', '{}', '--token-file', '/run/token', '--debug'))
        .toEqual(6);
      expect(io.stderr.output).toContain('[REDACTED]');
    });
  });

  describe('no --token flag', () => {
    it('rejects --token with a hint', async () => {
      expect(await io.run('games', 'mine', '--token', CLI_TOKEN)).toEqual(2);
      expect(io.stderr.output).toEqual('There is no --token flag: set MAJORA_TOKEN or use --token-file\n');
    });

    it('rejects --token=value with a hint, even with --debug', async () => {
      expect(await io.run('games', 'mine', `--token=${CLI_TOKEN}`, '--debug')).toEqual(2);
      expect(io.stderr.output).toContain('There is no --token flag');
    });
  });

  describe('no output path contains the token', () => {
    const paths = [
      ['--help', null, ['--help', '--debug']],
      ['resource --help', null, ['npcs', '--help']],
      ['--version', null, ['--version', '--debug']],
      ['success', (stub) => stub.reply(200, { id: 1 }), ['games', 'get', 'x', '--debug']],
      ['--all', (stub) => stub.reply(200, [{ id: 1 }], pageHeaders(1, 1)), ['npcs', 'list', '--game', 'g', '--all']],
      ['--meta', (stub) => stub.reply(200, [], pageHeaders(1, 1)), ['npcs', 'list', '--game', 'g', '--meta']],
      ['usage error', null, ['links', 'list', '--debug']],
      ['config error', null, ['games', 'mine', '--url', 'http://insecure', '--debug']],
      ['bad --data', null, ['npcs', 'create', '--game', 'g', '--data', 'nope', '--debug']],
      ['401', (stub) => stub.reply(401), ['games', 'mine', '--debug']],
      ['403', (stub) => stub.reply(403, { errors: ['scope_missing'] }), ['games', 'mine', '--debug']],
      ['404', (stub) => stub.reply(404), ['games', 'mine', '--debug']],
      ['409', (stub) => stub.reply(409, 'conflict'), ['games', 'mine', '--debug']],
      ['500', (stub) => stub.reply(500), ['games', 'mine', '--debug']],
      ['network', (stub) => stub.fail(new Error(`refused ${CLI_TOKEN}`)), ['games', 'mine', '--retries', '0', '--debug']],
      ['timeout', (stub) => stub.hang(), ['games', 'mine', '--retries', '0', '--timeout', '1', '--debug']],
    ];

    paths.forEach(([label, prepare, argv]) => {
      it(`on ${label}`, async () => {
        prepare?.(io.stub);
        await io.run(...argv);

        expectNoToken(io.stdout, io.stderr);
      });
    });

    it('redacts a token echoed by the API in an error', async () => {
      io.stub.reply(400, { errors: { header: [`Bearer ${CLI_TOKEN}`] } });

      expect(await io.run('npcs', 'update', '1', '--game', 'g', '--data', '-')).toEqual(6);
      expect(io.stderr.output).toContain('[REDACTED]');
    });

    it('redacts a token echoed in an internal error', async () => {
      io.stub.reply(200, { id: 1 });
      io.stdout.write = () => {
        throw new Error(`failed with ${CLI_TOKEN}`);
      };

      expect(await io.run('games', 'get', 'x', '--debug')).toEqual(1);
      expect(io.stderr.output).toContain('failed with [REDACTED]');
    });
  });
});
