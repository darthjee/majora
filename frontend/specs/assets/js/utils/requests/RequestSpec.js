import Request from '../../../../../assets/js/utils/requests/Request.js';

function config() {
  return {
    regular: { path: ({ gameSlug }) => `/games/${gameSlug}/npcs.json`, permission: null },
    private: { path: ({ gameSlug }) => `/games/${gameSlug}/npcs/all.json`, permission: 'can_edit' },
  };
}

function fakeClient() {
  return { fetchResource: jasmine.createSpy('fetchResource') };
}

function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

describe('Request', function() {
  let client;
  let request;

  beforeEach(function() {
    client = fakeClient();
    request = new Request('npc', 'collection', config(), client);
  });

  describe('#ensure', function() {
    it('starts a new fetch and resolves with the wrapped data', async function() {
      client.fetchResource.and.returnValue(Promise.resolve({ id: 1 }));

      const result = await request.ensure({ params: { gameSlug: 'demo' } });

      expect(client.fetchResource).toHaveBeenCalledWith('/games/demo/npcs.json', {}, jasmine.anything());
      expect(result).toEqual({ data: { id: 1 } });
    });

    it('dedupes concurrent calls with unchanged params/query/permissions into the same promise', function() {
      const first = deferred();
      client.fetchResource.and.returnValue(first.promise);

      const promiseA = request.ensure({ params: { gameSlug: 'demo' } });
      const promiseB = request.ensure({ params: { gameSlug: 'demo' } });

      expect(promiseA).toBe(promiseB);
      expect(client.fetchResource).toHaveBeenCalledTimes(1);
    });

    it('resolves immediately with cached data and does not refetch when nothing changed', async function() {
      client.fetchResource.and.returnValue(Promise.resolve({ id: 1 }));

      await request.ensure({ params: { gameSlug: 'demo' } });
      const result = await request.ensure({ params: { gameSlug: 'demo' } });

      expect(result).toEqual({ data: { id: 1 } });
      expect(client.fetchResource).toHaveBeenCalledTimes(1);
    });

    it('starts a fresh request with a new wrapper object when the query changes', async function() {
      client.fetchResource.and.returnValues(Promise.resolve({ id: 1 }), Promise.resolve({ id: 2 }));

      const first = await request.ensure({ params: { gameSlug: 'demo' }, query: {} });
      const second = await request.ensure({ params: { gameSlug: 'demo' }, query: { search: 'x' } });

      expect(client.fetchResource).toHaveBeenCalledTimes(2);
      expect(first).toEqual({ data: { id: 1 } });
      expect(second).toEqual({ data: { id: 2 } });
      expect(first).not.toBe(second);
    });

    it('passes the query through to the client', async function() {
      client.fetchResource.and.returnValue(Promise.resolve({ id: 1 }));

      await request.ensure({ params: { gameSlug: 'demo' }, query: { page: 2 } });

      expect(client.fetchResource).toHaveBeenCalledWith('/games/demo/npcs.json', { page: 2 }, jasmine.anything());
    });

    it('starts a fresh request when params change', async function() {
      client.fetchResource.and.returnValues(Promise.resolve({ id: 1 }), Promise.resolve({ id: 2 }));

      await request.ensure({ params: { gameSlug: 'demo' } });
      await request.ensure({ params: { gameSlug: 'other' } });

      expect(client.fetchResource).toHaveBeenCalledTimes(2);
      expect(client.fetchResource).toHaveBeenCalledWith('/games/demo/npcs.json', {}, jasmine.anything());
      expect(client.fetchResource).toHaveBeenCalledWith('/games/other/npcs.json', {}, jasmine.anything());
    });

    it('picks the private variant when the configured permission is granted', async function() {
      client.fetchResource.and.returnValue(Promise.resolve({ id: 1 }));

      await request.ensure({ params: { gameSlug: 'demo' }, permissions: { can_edit: true } });

      expect(client.fetchResource).toHaveBeenCalledWith('/games/demo/npcs/all.json', {}, jasmine.anything());
    });

    it('fails closed to the regular variant when the permission is unknown', async function() {
      client.fetchResource.and.returnValue(Promise.resolve({ id: 1 }));

      await request.ensure({ params: { gameSlug: 'demo' } });

      expect(client.fetchResource).toHaveBeenCalledWith('/games/demo/npcs.json', {}, jasmine.anything());
    });

    it('aborts the narrower in-flight request when a broader-access request supersedes it, ' +
      'and resolves the original promise with the replacement data', async function() {
      const regular = deferred();
      const privateFetch = deferred();

      client.fetchResource.and.callFake((path) => (
        path.endsWith('/all.json') ? privateFetch.promise : regular.promise
      ));

      const originalPromise = request.ensure({ params: { gameSlug: 'demo' } });

      const supersedingPromise = request.ensure({
        params: { gameSlug: 'demo' }, permissions: { can_edit: true },
      });

      expect(client.fetchResource).toHaveBeenCalledTimes(2);
      expect(originalPromise).toBe(supersedingPromise);

      privateFetch.resolve({ id: 'private' });
      const result = await originalPromise;

      expect(result).toEqual({ data: { id: 'private' } });

      regular.resolve({ id: 'regular' });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(await originalPromise).toEqual({ data: { id: 'private' } });
    });
  });

  describe('#abort', function() {
    it('clears cached/pending state so a later ensure() starts a fresh request', async function() {
      client.fetchResource.and.returnValues(Promise.resolve({ id: 1 }), Promise.resolve({ id: 2 }));

      await request.ensure({ params: { gameSlug: 'demo' } });
      request.abort();
      const result = await request.ensure({ params: { gameSlug: 'demo' } });

      expect(client.fetchResource).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: { id: 2 } });
    });
  });
});
