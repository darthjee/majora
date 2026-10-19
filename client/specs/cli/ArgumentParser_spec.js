import { ArgumentParser } from '../../src/cli/ArgumentParser.js';
import { UsageError } from '../../src/core/errors/UsageError.js';

describe('ArgumentParser', () => {
  let parser;

  const parse = (...argv) => parser.parse(argv);
  const expectUsage = (argv, message) => {
    expect(() => parser.parse(argv)).toThrowMatching(
      (error) => error instanceof UsageError && message.test(error.message),
    );
  };

  beforeEach(() => {
    parser = new ArgumentParser({ env: {} });
  });

  describe('commands', () => {
    it('parses games list', () => {
      expect(parse('games', 'list')).toEqual(jasmine.objectContaining({
        resource: 'games', action: 'list', id: undefined, help: false, version: false,
      }));
    });

    it('parses games mine', () => {
      expect(parse('games', 'mine').action).toEqual('mine');
    });

    it('parses games get with the slug as id', () => {
      expect(parse('games', 'get', 'epic-quest')).toEqual(jasmine.objectContaining({
        resource: 'games', action: 'get', id: 'epic-quest',
      }));
    });

    ['npcs', 'factions', 'items', 'documents'].forEach((resource) => {
      it(`parses every action of ${resource}`, () => {
        expect(parse(resource, 'list', '--game', 'g').action).toEqual('list');
        expect(parse(resource, 'get', '1', '--game', 'g').id).toEqual('1');
        expect(parse(resource, 'create', '--game', 'g', '--data', '{}').action).toEqual('create');
        expect(parse(resource, 'update', '1', '--game', 'g', '--data', '{}').id).toEqual('1');
      });
    });

    it('parses pcs list, get and update', () => {
      expect(parse('pcs', 'list', '--game', 'g').action).toEqual('list');
      expect(parse('pcs', 'get', '3', '--game', 'g').id).toEqual('3');
      expect(parse('pcs', 'update', '3', '--game', 'g', '--data', '{}').id).toEqual('3');
    });

    it('accepts flags before the positionals', () => {
      expect(parse('--game', 'g', '--restricted', 'npcs', 'get', '12')).toEqual(jasmine.objectContaining({
        resource: 'npcs', action: 'get', id: '12',
      }));
    });
  });

  describe('options', () => {
    it('normalizes every flag', () => {
      const { options } = parse(
        'npcs', 'list', '--url', 'https://m.example.com', '--token-file', '/tmp/t',
        '--allow-insecure-http', '--game', 'g', '--restricted', '--page', '2', '--per-page', '50',
        '--meta', '--query', 'name=Bob', '--timeout', '1000', '--retries', '0', '--debug',
      );

      expect(options).toEqual({
        url: 'https://m.example.com',
        tokenFile: '/tmp/t',
        allowInsecureHttp: true,
        game: 'g',
        restricted: true,
        page: 2,
        perPage: 50,
        all: false,
        meta: true,
        query: { name: 'Bob' },
        data: undefined,
        timeout: 1000,
        retries: 0,
        debug: true,
      });
    });

    it('defaults booleans to false and the rest to undefined', () => {
      expect(parse('games', 'list').options).toEqual({
        url: undefined,
        tokenFile: undefined,
        allowInsecureHttp: false,
        game: undefined,
        restricted: false,
        page: undefined,
        perPage: undefined,
        all: false,
        meta: false,
        query: undefined,
        data: undefined,
        timeout: undefined,
        retries: undefined,
        debug: false,
      });
    });

    it('keeps --all', () => {
      expect(parse('npcs', 'list', '--game', 'g', '--all', '--per-page', '10').options.all).toBeTrue();
    });

    it('builds the query from repeated --query flags', () => {
      expect(parse('npcs', 'list', '--game', 'g', '--query', 'a=1', '--query', 'b=2').options.query)
        .toEqual({ a: '1', b: '2' });
    });

    it('splits --query on the first =', () => {
      expect(parse('npcs', 'list', '--game', 'g', '--query', 'q=a=b').options.query).toEqual({ q: 'a=b' });
    });

    it('accepts an empty --query value', () => {
      expect(parse('npcs', 'list', '--game', 'g', '--query', 'q=').options.query).toEqual({ q: '' });
    });

    it('accepts --flag=value syntax', () => {
      expect(parse('npcs', 'list', '--game=g', '--page=3').options).toEqual(jasmine.objectContaining({
        game: 'g', page: 3,
      }));
    });
  });

  describe('--game', () => {
    it('falls back to MAJORA_GAME', () => {
      parser = new ArgumentParser({ env: { MAJORA_GAME: 'from-env' } });

      expect(parse('npcs', 'list').options.game).toEqual('from-env');
    });

    it('prefers --game over MAJORA_GAME', () => {
      parser = new ArgumentParser({ env: { MAJORA_GAME: 'from-env' } });

      expect(parse('npcs', 'list', '--game', 'from-flag').options.game).toEqual('from-flag');
    });

    it('fails on a game-scoped command without a game', () => {
      expectUsage(['npcs', 'list'], /Missing game for npcs/);
    });

    it('fails on an empty MAJORA_GAME', () => {
      parser = new ArgumentParser({ env: { MAJORA_GAME: '' } });

      expectUsage(['pcs', 'list'], /Missing game/);
    });

    it('ignores --game on games', () => {
      expect(parse('games', 'list', '--game', 'g').options.game).toBeUndefined();
    });

    it('needs no game for games', () => {
      expect(parse('games', 'mine').options.game).toBeUndefined();
    });

    it('works without options', () => {
      parser = new ArgumentParser();

      expectUsage(['npcs', 'list'], /Missing game/);
    });

    it('works with a null env', () => {
      parser = new ArgumentParser({ env: null });

      expectUsage(['npcs', 'list'], /Missing game/);
    });
  });

  describe('--help and --version', () => {
    it('short-circuits on --help', () => {
      expect(parse('--help')).toEqual(jasmine.objectContaining({ help: true, resource: undefined }));
    });

    it('keeps the resource for per-resource help', () => {
      expect(parse('npcs', '--help')).toEqual(jasmine.objectContaining({ help: true, resource: 'npcs' }));
    });

    it('skips the command checks with --help', () => {
      expect(parse('npcs', 'create', '--help').help).toBeTrue();
    });

    it('rejects --help on an unknown resource', () => {
      expectUsage(['links', '--help'], /Unknown resource: links/);
    });

    it('short-circuits on --version', () => {
      expect(parse('--version')).toEqual(jasmine.objectContaining({ version: true, help: false }));
    });

    it('keeps --debug', () => {
      expect(parse('--help', '--debug').options).toEqual({ debug: true });
    });
  });
});
