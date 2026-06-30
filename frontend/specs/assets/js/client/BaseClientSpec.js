import BaseClient from '../../../../assets/js/client/BaseClient.js';
import ActivityTracker from '../../../../assets/js/utils/ActivityTracker.js';

describe('BaseClient', function() {
  let fetchSpy;
  let client;
  let registerSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    registerSpy = spyOn(ActivityTracker, 'register');
    client = new BaseClient();
  });

  it('adds X-Skip-Cache to a configured endpoint', async function() {
    await client.request('/users/login.json', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/users/login.json', {
      method: 'POST',
      headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
      body: undefined,
    });
  });

  it('does not add X-Skip-Cache to a non-configured endpoint', async function() {
    await client.request('/some/other.json', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/some/other.json', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      body: undefined,
    });
  });

  it('adds X-Skip-Cache to a POST request to an unconfigured endpoint', async function() {
    await client.request('/some/other.json', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/some/other.json', {
      method: 'POST',
      headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
      body: undefined,
    });
  });

  it('adds X-Skip-Cache to a PATCH request to an unconfigured endpoint', async function() {
    await client.request('/some/other.json', {
      method: 'PATCH',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/some/other.json', {
      method: 'PATCH',
      headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
      body: undefined,
    });
  });

  it('adds X-Skip-Cache to a DELETE request to an unconfigured endpoint', async function() {
    await client.request('/some/other.json', {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/some/other.json', {
      method: 'DELETE',
      headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
      body: undefined,
    });
  });

  it('adds X-Skip-Cache to the register endpoint', async function() {
    await client.request('/users/register.json', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/users/register.json', {
      method: 'POST',
      headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
      body: undefined,
    });
  });

  it('matches a configured endpoint by pathname only, ignoring the query string', async function() {
    await client.request('/users/status.json?foo=bar', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/users/status.json?foo=bar', {
      method: 'GET',
      headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
      body: undefined,
    });
  });

  it('does not add X-Skip-Cache to a non-configured endpoint with a query string', async function() {
    await client.request('/games/foo/pcs.json?per_page=10', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/foo/pcs.json?per_page=10', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      body: undefined,
    });
  });

  it('adds X-Skip-Cache to an endpoint matching a configured suffix', async function() {
    await client.request('/games/demo/pcs/2/access.json', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/access.json', {
      method: 'GET',
      headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
      body: undefined,
    });
  });

  it('adds X-Skip-Cache to an NPC access endpoint matching a configured suffix', async function() {
    await client.request('/games/demo/npcs/5/access.json', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/5/access.json', {
      method: 'GET',
      headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
      body: undefined,
    });
  });

  it('adds X-Skip-Cache to a suffix-matched endpoint that also has a query string', async function() {
    await client.request('/games/demo/pcs/2/access.json?foo=bar', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/access.json?foo=bar', {
      method: 'GET',
      headers: { Accept: 'application/json', 'X-Skip-Cache': '1' },
      body: undefined,
    });
  });

  it('does not add X-Skip-Cache to a path that merely contains a suffix but does not end with it', async function() {
    await client.request('/games/demo/pcs/2/access.json/extra', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/access.json/extra', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      body: undefined,
    });
  });

  it('passes the signal option through to fetch when provided', async function() {
    const controller = new AbortController();

    await client.request('/some/path.json', { signal: controller.signal });

    expect(fetchSpy).toHaveBeenCalledWith('/some/path.json', jasmine.objectContaining({
      signal: controller.signal,
    }));
  });

  it('does not include signal in fetch options when none is provided', async function() {
    await client.request('/some/path.json');

    const [, options] = fetchSpy.calls.mostRecent().args;
    expect(options.signal).toBeUndefined();
  });

  describe('activity tracking', function() {
    it('registers activity for POST requests', async function() {
      await client.request('/games/foo.json', { method: 'POST' });

      expect(registerSpy).toHaveBeenCalled();
    });

    it('registers activity for PATCH requests', async function() {
      await client.request('/games/foo.json', { method: 'PATCH' });

      expect(registerSpy).toHaveBeenCalled();
    });

    it('registers activity for DELETE requests', async function() {
      await client.request('/games/foo.json', { method: 'DELETE' });

      expect(registerSpy).toHaveBeenCalled();
    });

    it('registers activity for GET requests to allowlisted game endpoints', async function() {
      await client.request('/games.json', { method: 'GET' });

      expect(registerSpy).toHaveBeenCalled();
    });

    it('registers activity for GET requests to game sub-paths', async function() {
      await client.request('/games/my-campaign/pcs.json', { method: 'GET' });

      expect(registerSpy).toHaveBeenCalled();
    });

    it('does not register activity for GET /health.json', async function() {
      await client.request('/health.json', { method: 'GET' });

      expect(registerSpy).not.toHaveBeenCalled();
    });

    it('does not register activity for GET /users/status.json', async function() {
      await client.request('/users/status.json', { method: 'GET' });

      expect(registerSpy).not.toHaveBeenCalled();
    });
  });
});
