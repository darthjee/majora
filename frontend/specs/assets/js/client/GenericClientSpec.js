import GenericClient from '../../../../assets/js/client/GenericClient.js';
import { mockFetchJson } from '../../../support/fetchMock.js';

describe('GenericClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
  });

  it('forwards all hash params in fetch', async function() {
    fetchSpy.and.returnValue(Promise.resolve(mockFetchJson({ ok: true })));

    const client = new GenericClient(() => '#/games/demo?foo=bar&page=2');
    await client.fetch('/games/demo.json');

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo.json?foo=bar&page=2', jasmine.any(Object));
  });

  it('forwards only pagination params in fetchIndex', async function() {
    fetchSpy.and.returnValue(Promise.resolve({
      ...mockFetchJson([]),
      headers: { get: () => null },
    }));

    const client = new GenericClient(() => '#/games?page=3&per_page=7&foo=bar');
    await client.fetchIndex('/games.json');

    expect(fetchSpy).toHaveBeenCalledWith('/games.json?page=3&per_page=7', jasmine.any(Object));
  });

  it('merges non-blank extraParams over pagination params in fetchIndex', async function() {
    fetchSpy.and.returnValue(Promise.resolve({
      ...mockFetchJson([]),
      headers: { get: () => null },
    }));

    const client = new GenericClient(() => '#/games/demo/npcs?page=3');
    await client.fetchIndex('/games/demo/npcs.json', { slain: 'true', name: 'gob', extra: '' });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs.json?page=3&slain=true&name=gob', jasmine.any(Object));
  });

  it('does not send extraParams when none are given', async function() {
    fetchSpy.and.returnValue(Promise.resolve({
      ...mockFetchJson([]),
      headers: { get: () => null },
    }));

    const client = new GenericClient(() => '#/games/demo/npcs?page=3');
    await client.fetchIndex('/games/demo/npcs.json');

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs.json?page=3', jasmine.any(Object));
  });

  it('returns pagination defaults when headers are missing', async function() {
    fetchSpy.and.returnValue(Promise.resolve({
      ...mockFetchJson([]),
      headers: { get: () => null },
    }));

    const client = new GenericClient();
    const result = await client.fetchIndex('/games.json');
    expect(result.pagination).toEqual({ page: 1, pages: 1, perPage: 10 });
  });

  it('throws with request path when response is not ok', async function() {
    fetchSpy.and.returnValue(Promise.resolve({ ok: false }));

    const client = new GenericClient();
    await expectAsync(client.fetch('/games.json')).toBeRejectedWithError('Request failed for /games.json');
  });
});
