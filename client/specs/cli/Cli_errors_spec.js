import { CLI_URL, buildCli, expectNoToken } from '../support/buildCli.js';
import { pageHeaders } from '../support/buildCore.js';

describe('Cli errors', () => {
  let io;

  const stderrLines = () => io.stderr.output.split('\n').filter((line) => line !== '');

  beforeEach(() => {
    io = buildCli();
  });

  afterEach(() => {
    expectNoToken(io.stdout, io.stderr);
  });

  describe('API errors', () => {
    [
      [401, 3, 'AuthenticationError'],
      [403, 4, 'PermissionError'],
      [404, 5, 'NotFoundError'],
      [409, 7, 'ApiError'],
      [422, 7, 'ApiError'],
      [500, 8, 'ServerError'],
    ].forEach(([status, code, name]) => {
      it(`exits ${code} on ${status}`, async () => {
        io.stub.reply(status, { errors: ['scope_missing'] });

        expect(await io.run('npcs', 'get', '12', '--game', 'g', '--retries', '0')).toEqual(code);
        expect(io.stderr.output).toEqual(`${status} ${name} on GET /games/g/npcs/12.json: scope_missing\n`);
        expect(io.stdout.output).toEqual('');
      });
    });

    it('exits 8 on 503 once the retries are exhausted', async () => {
      io.stub.reply(503).reply(503);

      expect(await io.run('games', 'list', '--retries', '1', '--timeout', '1000')).toEqual(8);
      expect(io.stub.calls.length).toEqual(2);
    });

    it('exits 6 on 400 and prints the fields', async () => {
      io.stub.reply(400, { errors: { name: ['blank'] } });

      expect(await io.run('npcs', 'create', '--game', 'g', '--data', '{"name":""}')).toEqual(6);
      expect(stderrLines()).toEqual([
        '400 ValidationError on POST /games/g/npcs.json: blank',
        '{"name":["blank"]}',
      ]);
    });
  });

  describe('network errors', () => {
    it('exits 9 on a network failure', async () => {
      io.stub.fail(new TypeError('fetch failed'));

      expect(await io.run('games', 'mine', '--retries', '0')).toEqual(9);
      expect(io.stderr.output).toEqual('Network error on GET /my-games.json\n');
    });

    it('exits 9 on a timeout', async () => {
      io.stub.hang();

      expect(await io.run('games', 'mine', '--retries', '0', '--timeout', '5')).toEqual(9);
      expect(io.stderr.output).toEqual('Timeout on GET /my-games.json\n');
    });
  });

  describe('usage and configuration errors', () => {
    it('exits 2 on a usage error without any request', async () => {
      expect(await io.run('pcs', 'create', '--game', 'g', '--data', '{}')).toEqual(2);
      expect(io.stderr.output).toEqual('Unknown action for pcs: create\n');
      expect(io.stub.calls).toEqual([]);
    });

    it('exits 2 without arguments', async () => {
      expect(await io.run()).toEqual(2);
      expect(io.stderr.output).toContain('Missing resource');
    });

    it('exits 2 on --restricted without the variant', async () => {
      expect(await io.run('pcs', 'list', '--game', 'g', '--restricted')).toEqual(2);
      expect(io.stderr.output).toEqual('Pcs has no restricted variant for list\n');
      expect(io.stub.calls).toEqual([]);
    });

    it('exits 2 on games mine --restricted', async () => {
      expect(await io.run('games', 'mine', '--restricted')).toEqual(2);
      expect(io.stub.calls).toEqual([]);
    });

    it('exits 2 on --all --restricted without the variant', async () => {
      expect(await io.run('factions', 'list', '--game', 'g', '--all', '--restricted')).toEqual(2);
      expect(io.stub.calls).toEqual([]);
    });

    it('exits 2 on a missing URL', async () => {
      io = buildCli({ env: { MAJORA_URL: '' } });

      expect(await io.run('games', 'mine')).toEqual(2);
      expect(io.stderr.output).toContain('Missing baseUrl');
    });

    it('exits 2 on a missing token', async () => {
      io = buildCli({ env: { MAJORA_TOKEN: '' } });

      expect(await io.run('games', 'mine')).toEqual(2);
      expect(io.stderr.output).toContain('Missing token');
    });

    it('exits 2 on an insecure URL', async () => {
      expect(await io.run('games', 'mine', '--url', 'http://majora:3000')).toEqual(2);
      expect(io.stderr.output).toContain('Insecure baseUrl');
    });

    it('exits 2 on invalid --data', async () => {
      expect(await io.run('npcs', 'create', '--game', 'g', '--data', '{nope')).toEqual(2);
      expect(io.stderr.output).toEqual('Invalid --data: inline --data is not valid JSON\n');
      expect(io.stub.calls).toEqual([]);
    });

    it('exits 2 on a non-object --data', async () => {
      expect(await io.run('npcs', 'update', '1', '--game', 'g', '--data', '[1]')).toEqual(2);
      expect(io.stderr.output).toEqual('Invalid --data: inline --data must be a JSON object\n');
    });
  });

  describe('internal errors', () => {
    it('maps a failure while reading the response to 9', async () => {
      io.stub.handleWith(() => ({ get ok() { throw new TypeError('kaboom'); } }));

      expect(await io.run('games', 'mine', '--retries', '0')).toEqual(9);
    });

    it('exits 1 on an unexpected rejection of the output', async () => {
      io.stub.reply(200, { id: 1 });
      io.stdout.write = () => {
        throw new RangeError('out of memory');
      };

      expect(await io.run('games', 'get', 'g')).toEqual(1);
      expect(io.stderr.output).toEqual('out of memory\n');
    });

    it('reports a non-Error value', async () => {
      io.stub.reply(200, { id: 1 });
      io.stdout.write = () => {
        throw 'plain string';
      };

      expect(await io.run('games', 'get', 'g', '--debug')).toEqual(1);
      expect(io.stderr.output).toEqual('plain string\n');
    });

    it('survives a broken stderr', async () => {
      io.stderr.write = () => {
        throw new Error('stderr closed');
      };

      expect(await io.run('links', 'list')).toEqual(2);
    });
  });

  describe('--debug', () => {
    it('prints the stack trace', async () => {
      io.stub.reply(404, { error: 'not_found' });

      expect(await io.run('games', 'get', 'x', '--debug')).toEqual(5);
      expect(stderrLines()[0]).toEqual('404 NotFoundError on GET /games/x.json: not_found');
      expect(io.stderr.output).toContain('NotFoundError: 404 NotFoundError');
      expect(io.stderr.output).toMatch(/\n\s+at /);
    });

    it('prints the stack trace of a usage error', async () => {
      expect(await io.run('links', 'list', '--debug')).toEqual(2);
      expect(io.stderr.output).toMatch(/UsageError: Unknown resource: links\n\s+at /);
    });

    it('prints no stack trace without --debug', async () => {
      io.stub.reply(404);

      await io.run('games', 'get', 'x');
      expect(io.stderr.output).not.toMatch(/\s+at /);
    });

    it('never prints the request headers', async () => {
      io.stub.reply(401);

      await io.run('games', 'mine', '--debug');
      expect(io.stderr.output).not.toContain('Authorization');
      expect(io.stderr.output).not.toContain('Bearer');
    });
  });

  describe('interrupt', () => {
    it('exits 130 when aborted during a request', async () => {
      io.stub.hang();
      const promise = io.run('games', 'mine');

      await new Promise((resolve) => setImmediate(resolve));
      io.cli.abort();

      expect(await promise).toEqual(130);
      expect(io.stderr.output).toEqual('');
    });

    it('exits 130 when aborted during --all', async () => {
      io.stub.reply(200, [{ id: 1 }], pageHeaders(1, 3)).hang();
      const promise = io.run('npcs', 'list', '--game', 'g', '--all');

      while (io.stub.calls.length < 2) {
        await new Promise((resolve) => setImmediate(resolve));
      }
      io.cli.abort();

      expect(await promise).toEqual(130);
      expect(io.stdout.output).toEqual('{"id":1}\n');
      expect(io.stub.calls[1].options.signal.aborted).toBeTrue();
    });

    it('stops --all between items when aborted', async () => {
      io.stub.reply(200, [{ id: 1 }, { id: 2 }, { id: 3 }], pageHeaders(1, 1));
      const promise = io.run('npcs', 'list', '--game', 'g', '--all');
      const original = io.stdout.write.bind(io.stdout);

      io.stdout.write = (chunk, callback) => {
        io.cli.abort();
        return original(chunk, callback);
      };

      expect(await promise).toEqual(130);
      expect(io.stdout.output).toEqual('{"id":1}\n');
    });

    it('exits 130 when the injected signal aborts', async () => {
      const controller = new AbortController();

      io = buildCli({ signal: controller.signal });
      io.stub.hang();
      const promise = io.run('games', 'mine');

      await new Promise((resolve) => setImmediate(resolve));
      controller.abort();

      expect(await promise).toEqual(130);
    });
  });

  describe('closed pipe', () => {
    it('exits 0 quietly on EPIPE during --all', async () => {
      io.stub.reply(200, [{ id: 1 }, { id: 2 }, { id: 3 }], pageHeaders(1, 2)).reply(200, [{ id: 4 }], pageHeaders(2, 2));
      io.stdout.closeAfter(1);

      expect(await io.run('npcs', 'list', '--game', 'g', '--all')).toEqual(0);
      expect(io.stdout.output).toEqual('{"id":1}\n');
      expect(io.stderr.output).toEqual('');
      expect(io.stub.calls.length).toEqual(1);
    });

    it('exits 0 quietly on EPIPE for an object', async () => {
      io.stub.reply(200, { id: 1 });
      io.stdout.closeAfter(0);

      expect(await io.run('games', 'get', 'x')).toEqual(0);
      expect(io.stderr.output).toEqual('');
    });
  });

  it('targets the configured URL', async () => {
    io.stub.reply(200, []);
    await io.run('games', 'mine');

    expect(io.stub.lastCall.url).toEqual(`${CLI_URL}/my-games.json`);
  });
});
