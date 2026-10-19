import { Cli } from '../../src/cli/Cli.js';
import { CLI_URL, buildCli, expectNoToken } from '../support/buildCli.js';
import { pageHeaders } from '../support/buildCore.js';
import { FakeWritable, fakeStdin } from '../support/FakeStreams.js';

describe('Cli', () => {
  let io;

  const urls = () => io.stub.calls.map((call) => call.url);
  const lastCall = () => io.stub.lastCall;
  const json = () => JSON.parse(io.stdout.output);

  beforeEach(() => {
    io = buildCli({ stdin: fakeStdin('{"name":"From stdin"}') });
  });

  afterEach(() => {
    expectNoToken(io.stdout, io.stderr);
  });

  describe('games', () => {
    it('lists games', async () => {
      io.stub.reply(200, [{ slug: 'a' }], pageHeaders(1, 1));

      expect(await io.run('games', 'list')).toEqual(0);
      expect(urls()).toEqual([`${CLI_URL}/games.json`]);
      expect(io.stdout.output).toEqual(`${JSON.stringify([{ slug: 'a' }], null, 2)}\n`);
      expect(io.stderr.output).toEqual('');
    });

    it('prints my games', async () => {
      io.stub.reply(200, [{ slug: 'mine' }]);

      expect(await io.run('games', 'mine')).toEqual(0);
      expect(urls()).toEqual([`${CLI_URL}/my-games.json`]);
      expect(json()).toEqual([{ slug: 'mine' }]);
    });

    it('gets a game by slug', async () => {
      io.stub.reply(200, { slug: 'epic-quest' });

      expect(await io.run('games', 'get', 'epic-quest')).toEqual(0);
      expect(urls()).toEqual([`${CLI_URL}/games/epic-quest.json`]);
      expect(json()).toEqual({ slug: 'epic-quest' });
    });

    it('ignores --game', async () => {
      io.stub.reply(200, [], pageHeaders(1, 1));

      expect(await io.run('games', 'list', '--game', 'other')).toEqual(0);
      expect(urls()).toEqual([`${CLI_URL}/games.json`]);
    });

    it('sends the Bearer token from MAJORA_TOKEN', async () => {
      io.stub.reply(200, []);
      await io.run('games', 'mine');

      expect(lastCall().options.headers.Authorization).toEqual('Bearer mjr_secret_token_value');
    });
  });

  ['npcs', 'factions', 'items', 'documents'].forEach((family) => {
    describe(family, () => {
      const base = `${CLI_URL}/games/epic-quest/${family}`;

      it('lists', async () => {
        io.stub.reply(200, [{ id: 1 }], pageHeaders(1, 1));

        expect(await io.run(family, 'list', '--game', 'epic-quest')).toEqual(0);
        expect(urls()).toEqual([`${base}.json`]);
        expect(json()).toEqual([{ id: 1 }]);
      });

      it('gets', async () => {
        io.stub.reply(200, { id: 12 });

        expect(await io.run(family, 'get', '12', '--game', 'epic-quest')).toEqual(0);
        expect(urls()).toEqual([`${base}/12.json`]);
        expect(json()).toEqual({ id: 12 });
      });

      it('creates from inline JSON', async () => {
        io.stub.reply(201, { id: 13, name: 'Bob' });

        expect(await io.run(family, 'create', '--game', 'epic-quest', '--data', '{"name":"Bob"}')).toEqual(0);
        expect(lastCall().url).toEqual(`${base}.json`);
        expect(lastCall().options.method).toEqual('POST');
        expect(JSON.parse(lastCall().options.body)).toEqual({ name: 'Bob' });
        expect(json()).toEqual({ id: 13, name: 'Bob' });
      });

      it('updates', async () => {
        io.stub.reply(200, { id: 12, name: 'Robert' });

        expect(await io.run(family, 'update', '12', '--game', 'epic-quest', '--data', '{"name":"Robert"}'))
          .toEqual(0);
        expect(lastCall().url).toEqual(`${base}/12.json`);
        expect(lastCall().options.method).toEqual('PATCH');
        expect(json()).toEqual({ id: 12, name: 'Robert' });
      });
    });
  });

  describe('pcs', () => {
    it('lists, gets and updates', async () => {
      io.stub.reply(200, [], pageHeaders(1, 1)).reply(200, { id: 3 }).reply(200, { id: 3 });

      expect(await io.run('pcs', 'list', '--game', 'g')).toEqual(0);
      expect(await io.run('pcs', 'get', '3', '--game', 'g', '--restricted')).toEqual(0);
      expect(await io.run('pcs', 'update', '3', '--game', 'g', '--data', '{}')).toEqual(0);
      expect(urls()).toEqual([
        `${CLI_URL}/games/g/pcs.json`, `${CLI_URL}/games/g/pcs/3/full.json`, `${CLI_URL}/games/g/pcs/3.json`,
      ]);
    });
  });

  describe('request options', () => {
    it('uses the restricted variant', async () => {
      io.stub.reply(200, { id: 12 });
      await io.run('npcs', 'get', '12', '--game', 'epic-quest', '--restricted');

      expect(urls()).toEqual([`${CLI_URL}/games/epic-quest/npcs/12/full.json`]);
    });

    it('creates on the restricted variant', async () => {
      io.stub.reply(201, { id: 1 });
      await io.run('npcs', 'create', '--game', 'g', '--restricted', '--data', '{}');

      expect(urls()).toEqual([`${CLI_URL}/games/g/npcs/full.json`]);
    });

    it('sends page, per_page and the query filters', async () => {
      io.stub.reply(200, [], pageHeaders(2, 3));
      await io.run('npcs', 'list', '--game', 'g', '--restricted', '--page', '2', '--per-page', '5',
        '--query', 'name=Bob', '--query', 'q=a=b');

      expect(urls()).toEqual([`${CLI_URL}/games/g/npcs/all.json?name=Bob&q=a%3Db&page=2&per_page=5`]);
    });

    it('falls back to MAJORA_GAME', async () => {
      io = buildCli({ env: { MAJORA_GAME: 'from-env' } });
      io.stub.reply(200, [], pageHeaders(1, 1));
      await io.run('items', 'list');

      expect(urls()).toEqual([`${CLI_URL}/games/from-env/items.json`]);
    });

    it('prefers --game over MAJORA_GAME', async () => {
      io = buildCli({ env: { MAJORA_GAME: 'from-env' } });
      io.stub.reply(200, [], pageHeaders(1, 1));
      await io.run('items', 'list', '--game', 'flag');

      expect(urls()).toEqual([`${CLI_URL}/games/flag/items.json`]);
    });

    it('prefers --url over MAJORA_URL', async () => {
      io.stub.reply(200, []);
      await io.run('games', 'mine', '--url', 'https://other.example.com/');

      expect(urls()).toEqual(['https://other.example.com/my-games.json']);
    });

    it('allows insecure http with --allow-insecure-http', async () => {
      io.stub.reply(200, []);

      expect(await io.run('games', 'mine', '--url', 'http://majora:3000', '--allow-insecure-http')).toEqual(0);
      expect(urls()).toEqual(['http://majora:3000/my-games.json']);
    });
  });

  describe('--data sources', () => {
    it('reads the body from stdin', async () => {
      io.stub.reply(201, { id: 1 });
      await io.run('npcs', 'create', '--game', 'g', '--data', '-');

      expect(JSON.parse(lastCall().options.body)).toEqual({ name: 'From stdin' });
    });

    it('reads the body from a file', async () => {
      const readFile = jasmine.createSpy('readFile').and.resolveTo('{"name":"From file"}');

      io = buildCli({ readFile });
      io.stub.reply(200, { id: 1 });
      await io.run('npcs', 'update', '1', '--game', 'g', '--data', '@body.json');

      expect(readFile).toHaveBeenCalledWith('body.json', 'utf8');
      expect(JSON.parse(lastCall().options.body)).toEqual({ name: 'From file' });
    });
  });

  describe('list output', () => {
    it('prints [] for an empty list', async () => {
      io.stub.reply(200, [], pageHeaders(1, 1, 2, 0));
      await io.run('npcs', 'list', '--game', 'g');

      expect(io.stdout.output).toEqual('[]\n');
    });

    it('prints the page metadata with --meta', async () => {
      io.stub.reply(200, [{ id: 1 }], pageHeaders(2, 3, 1, 3));
      await io.run('npcs', 'list', '--game', 'g', '--meta', '--page', '2');

      expect(json()).toEqual({ data: [{ id: 1 }], page: 2, pages: 3, perPage: 1, total: 3 });
    });

    it('streams every page as NDJSON with --all', async () => {
      io.stub
        .reply(200, [{ id: 1 }, { id: 2 }], pageHeaders(1, 2))
        .reply(200, [{ id: 3 }], pageHeaders(2, 2));

      expect(await io.run('npcs', 'list', '--game', 'g', '--all', '--per-page', '2')).toEqual(0);
      expect(io.stdout.output).toEqual('{"id":1}\n{"id":2}\n{"id":3}\n');
      expect(urls()).toEqual([
        `${CLI_URL}/games/g/npcs.json?per_page=2`, `${CLI_URL}/games/g/npcs.json?page=2&per_page=2`,
      ]);
    });

    it('prints nothing for an empty --all', async () => {
      io.stub.reply(200, [], pageHeaders(1, 1));

      expect(await io.run('npcs', 'list', '--game', 'g', '--all')).toEqual(0);
      expect(io.stdout.output).toEqual('');
    });
  });

  describe('--help and --version', () => {
    it('prints the global help', async () => {
      expect(await io.run('--help')).toEqual(0);
      expect(io.stdout.output).toContain('Usage: majora <resource> <action>');
      expect(io.stub.calls).toEqual([]);
    });

    it('prints the resource help', async () => {
      expect(await io.run('pcs', '--help')).toEqual(0);
      expect(io.stdout.output).toContain('Usage: majora pcs <action> --game <slug>');
    });

    it('prints the package version', async () => {
      expect(await io.run('--version')).toEqual(0);
      expect(io.stdout.output).toMatch(/^\d+\.\d+\.\d+\S*\n$/);
    });
  });

  describe('construction', () => {
    it('works with the default options', async () => {
      const stdout = new FakeWritable();
      const stderr = new FakeWritable();
      const cli = new Cli({ stdout, stderr, env: null });

      expect(await cli.run(['games', 'mine'])).toEqual(2);
      expect(stderr.output).toContain('Missing baseUrl');
    });
  });
});
