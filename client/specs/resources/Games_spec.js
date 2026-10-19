import { UsageError } from '../../src/core/errors/UsageError.js';
import { Page } from '../../src/core/Page.js';
import { Games } from '../../src/resources/Games.js';
import { Resource } from '../../src/resources/Resource.js';
import { FetchStub } from '../support/FetchStub.js';
import { BASE_URL, buildCore, collect, pageHeaders } from '../support/buildCore.js';
import { itResolvesVariants } from '../support/variantExamples.js';

describe('Games', () => {
  let stub;
  let games;

  beforeEach(() => {
    stub = new FetchStub();
    const { http, paginator } = buildCore(stub);

    games = new Games(http, paginator);
  });

  itResolvesVariants((http, paginator) => new Games(http, paginator), {
    list: ['games', null],
    get: ['games/12', null],
  });

  it('is a top-level Resource', () => {
    expect(games).toEqual(jasmine.any(Resource));
    expect(games.basePath).toEqual('games');
  });

  describe('list', () => {
    it('returns a Page of games.json', async () => {
      stub.reply(200, [{ slug: 'epic-quest' }], pageHeaders(1, 2));
      const page = await games.list({ perPage: 1 });

      expect(page).toEqual(jasmine.any(Page));
      expect(page.data).toEqual([{ slug: 'epic-quest' }]);
      expect(page.hasNext).toBeTrue();
      expect(stub.lastCall.url).toEqual(`${BASE_URL}/games.json?per_page=1`);
    });

    it('iterates over every page', async () => {
      stub.reply(200, [{ slug: 'a' }], pageHeaders(1, 2)).reply(200, [{ slug: 'b' }], pageHeaders(2, 2));

      expect(await collect(games.iterate())).toEqual([{ slug: 'a' }, { slug: 'b' }]);
      expect(stub.lastCall.url).toEqual(`${BASE_URL}/games.json?page=2`);
    });
  });

  describe('mine', () => {
    it('returns the plain parsed array of my-games.json', async () => {
      stub.reply(200, [{ slug: 'epic-quest' }]);
      const result = await games.mine();

      expect(result).toEqual([{ slug: 'epic-quest' }]);
      expect(result).not.toEqual(jasmine.any(Page));
      expect(stub.lastCall.url).toEqual(`${BASE_URL}/my-games.json`);
      expect(stub.lastCall.options.method).toEqual('GET');
    });

    it('forwards the request options', async () => {
      stub.reply(200, []);
      await games.mine({ headers: { 'X-Extra': '1' }, restricted: false });

      expect(stub.lastCall.options.headers['X-Extra']).toEqual('1');
      expect(stub.lastCall.url).toEqual(`${BASE_URL}/my-games.json`);
    });

    it('rejects a restricted call with UsageError, without any request', async () => {
      await expectAsync(games.mine({ restricted: true })).toBeRejectedWithError(UsageError);
      expect(stub.calls).toEqual([]);
    });
  });

  describe('get', () => {
    it('fetches games/<slug>.json', async () => {
      stub.reply(200, { slug: 'epic-quest' });

      expect(await games.get('epic-quest')).toEqual({ slug: 'epic-quest' });
      expect(stub.lastCall.url).toEqual(`${BASE_URL}/games/epic-quest.json`);
    });

    it('URL-encodes the slug', async () => {
      stub.reply(200, {});
      await games.get('a b/c');

      expect(stub.lastCall.url).toEqual(`${BASE_URL}/games/a%20b%2Fc.json`);
    });

    it('rejects a blank slug with UsageError, without any request', async () => {
      for (const slug of [undefined, null, '']) {
        await expectAsync(games.get(slug)).toBeRejectedWithError(UsageError, 'Missing game slug');
      }
      expect(stub.calls).toEqual([]);
    });
  });
});
