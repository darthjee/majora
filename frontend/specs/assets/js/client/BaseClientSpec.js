import BaseClient from '../../../../assets/js/client/BaseClient.js';

describe('BaseClient', function() {
  let fetchSpy;
  let client;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
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
    await client.request('/games.json', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games.json', {
      method: 'GET',
      headers: { Accept: 'application/json' },
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
});
