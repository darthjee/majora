import { Config } from '../../src/core/Config.js';
import { HttpClient } from '../../src/core/HttpClient.js';
import { Page } from '../../src/core/Page.js';
import { Paginator } from '../../src/core/Paginator.js';
import { FetchStub } from '../support/FetchStub.js';

describe('Paginator', () => {
  let stub;
  let sleep;
  let paginator;

  const headers = (page, pages, perPage = 2, total = 5) => ({
    page: String(page), pages: String(pages), per_page: String(perPage), total: String(total),
  });
  const queryOf = (call) => Object.fromEntries(new URL(call.url).searchParams);

  beforeEach(() => {
    stub = new FetchStub();
    sleep = jasmine.createSpy('sleep').and.resolveTo();
    const config = new Config({ baseUrl: 'https://majora.example.com', token: 'mjr_t', fetch: stub.fetch, env: {} });

    paginator = new Paginator(new HttpClient(config, { sleep }));
  });

  describe('list', () => {
    it('returns a Page read from the headers', async () => {
      stub.reply(200, [{ id: 3 }, { id: 4 }], headers(2, 3));
      const page = await paginator.list('games/x/npcs', { page: 2, perPage: 2 });

      expect(page).toEqual(jasmine.any(Page));
      expect(page.data).toEqual([{ id: 3 }, { id: 4 }]);
      expect(page.page).toEqual(2);
      expect(page.pages).toEqual(3);
      expect(page.perPage).toEqual(2);
      expect(page.total).toEqual(5);
      expect(stub.lastCall.url).toEqual('https://majora.example.com/games/x/npcs.json?page=2&per_page=2');
    });

    it('sends neither page nor per_page when omitted', async () => {
      stub.reply(200, []);
      await paginator.list('my-games');

      expect(stub.lastCall.url).toEqual('https://majora.example.com/my-games.json');
    });

    it('passes perPage through only when given', async () => {
      stub.reply(200, []);
      await paginator.list('games', { perPage: 50 });

      expect(queryOf(stub.lastCall)).toEqual({ per_page: '50' });
    });

    it('sends filters from query', async () => {
      stub.reply(200, []);
      await paginator.list('games/x/npcs', { page: 1, query: { name: 'Bob', slain: false } });

      expect(queryOf(stub.lastCall)).toEqual({ name: 'Bob', slain: 'false', page: '1' });
    });

    it('does not let filters override page and per_page', async () => {
      stub.reply(200, []).reply(200, []);
      await paginator.list('games', { page: 2, perPage: 10, query: { page: 9, per_page: 99 } });

      expect(queryOf(stub.calls[0])).toEqual({ page: '2', per_page: '10' });

      await paginator.list('games', { query: { page: 9, per_page: 99, name: 'Bob' } });

      expect(queryOf(stub.calls[1])).toEqual({ name: 'Bob' });
    });

    it('passes request options through', async () => {
      const controller = new AbortController();

      stub.reply(200, []);
      await paginator.list('games', { signal: controller.signal, timeout: 0, headers: { 'X-A': '1' } });

      expect(stub.lastCall.options.signal).toBe(controller.signal);
      expect(stub.lastCall.options.headers['X-A']).toEqual('1');
    });

    it('fetches the next page with the same options', async () => {
      stub.reply(200, [{ id: 1 }], headers(1, 2, 1, 2)).reply(200, [{ id: 2 }], headers(2, 2, 1, 2));
      const first = await paginator.list('games/x/npcs', { perPage: 1, query: { name: 'Bob' } });
      const second = await first.next();

      expect(second.data).toEqual([{ id: 2 }]);
      expect(queryOf(stub.calls[1])).toEqual({ name: 'Bob', page: '2', per_page: '1' });
      expect(await second.next()).toBeNull();
      expect(stub.calls.length).toEqual(2);
    });

    it('returns a single page for a non-paginated endpoint', async () => {
      stub.reply(200, [{ id: 1 }, { id: 2 }]);
      const page = await paginator.list('my-games');

      expect([page.page, page.pages, page.total]).toEqual([1, 1, 2]);
      expect(page.hasNext).toBeFalse();
    });
  });

  describe('iterate', () => {
    const queueThreePages = () => {
      stub
        .reply(200, [{ id: 1 }, { id: 2 }], headers(1, 3))
        .reply(200, [{ id: 3 }, { id: 4 }], headers(2, 3))
        .reply(200, [{ id: 5 }], headers(3, 3));
    };

    it('walks the items of every page', async () => {
      queueThreePages();
      const ids = [];

      for await (const item of paginator.iterate('games/x/npcs', { query: { slain: false } })) {
        ids.push(item.id);
      }

      expect(ids).toEqual([1, 2, 3, 4, 5]);
      expect(stub.calls.map((call) => queryOf(call).page)).toEqual([undefined, '2', '3']);
      expect(stub.calls.every((call) => queryOf(call).slain === 'false')).toBeTrue();
    });

    it('fetches pages lazily', async () => {
      queueThreePages();
      const ids = [];

      for await (const item of paginator.iterate('games/x/npcs')) {
        ids.push(item.id);
        if (item.id === 2) {
          break;
        }
      }

      expect(ids).toEqual([1, 2]);
      expect(stub.calls.length).toEqual(1);
    });

    it('starts from the given page and keeps perPage', async () => {
      stub.reply(200, [{ id: 3 }], headers(2, 2, 1, 2));
      const items = [];

      for await (const item of paginator.iterate('games', { page: 2, perPage: 1 })) {
        items.push(item);
      }

      expect(items).toEqual([{ id: 3 }]);
      expect(queryOf(stub.lastCall)).toEqual({ page: '2', per_page: '1' });
    });

    it('stops on an empty page', async () => {
      stub.reply(200, [], headers(1, 5));
      const items = [];

      for await (const item of paginator.iterate('games')) {
        items.push(item);
      }

      expect(items).toEqual([]);
      expect(stub.calls.length).toEqual(1);
    });

    it('retries a failed page without refetching the earlier ones', async () => {
      stub
        .reply(200, [{ id: 1 }, { id: 2 }], headers(1, 3))
        .reply(502, '<html>Bad Gateway</html>')
        .reply(200, [{ id: 3 }, { id: 4 }], headers(2, 3))
        .reply(200, [{ id: 5 }], headers(3, 3));
      const ids = [];

      for await (const item of paginator.iterate('games/x/npcs')) {
        ids.push(item.id);
      }

      expect(ids).toEqual([1, 2, 3, 4, 5]);
      expect(stub.calls.map((call) => queryOf(call).page)).toEqual([undefined, '2', '2', '3']);
      expect(sleep).toHaveBeenCalledTimes(1);
    });
  });
});
