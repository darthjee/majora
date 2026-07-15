import BaseClient from '../../../../../assets/js/client/BaseClient.js';
import ActivityTracker from '../../../../../assets/js/utils/logging/ActivityTracker.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('BaseClient', function() {
  let fetchSpy;
  let client;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
    spyOn(ActivityTracker, 'register');
    client = new BaseClient();
  });

  it('adds X-Skip-Cache to a configured endpoint', async function() {
    await client.request('/users/login.json', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/users/login.json', jasmine.objectContaining({
      method: 'POST',
      headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      body: undefined,
    }));
  });

  it('does not add X-Skip-Cache to a non-configured endpoint', async function() {
    await client.request('/some/other.json', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/some/other.json', jasmine.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json' },
      body: undefined,
    }));
  });

  it('adds X-Skip-Cache to a POST request to an unconfigured endpoint', async function() {
    await client.request('/some/other.json', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/some/other.json', jasmine.objectContaining({
      method: 'POST',
      headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      body: undefined,
    }));
  });

  it('adds X-Skip-Cache to a PATCH request to an unconfigured endpoint', async function() {
    await client.request('/some/other.json', {
      method: 'PATCH',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/some/other.json', jasmine.objectContaining({
      method: 'PATCH',
      headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      body: undefined,
    }));
  });

  it('adds X-Skip-Cache to a DELETE request to an unconfigured endpoint', async function() {
    await client.request('/some/other.json', {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/some/other.json', jasmine.objectContaining({
      method: 'DELETE',
      headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      body: undefined,
    }));
  });

  it('adds X-Skip-Cache to the register endpoint', async function() {
    await client.request('/users/register.json', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/users/register.json', jasmine.objectContaining({
      method: 'POST',
      headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      body: undefined,
    }));
  });

  it('matches a configured endpoint by pathname only, ignoring the query string', async function() {
    await client.request('/users/status.json?foo=bar', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/users/status.json?foo=bar', jasmine.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      body: undefined,
    }));
  });

  it('does not add X-Skip-Cache to a non-configured endpoint with a query string', async function() {
    await client.request('/games/foo/pcs.json?per_page=10', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/foo/pcs.json?per_page=10', jasmine.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json' },
      body: undefined,
    }));
  });

  it('adds X-Skip-Cache to an endpoint matching a configured suffix', async function() {
    await client.request('/games/demo/pcs/2/access.json', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/access.json', jasmine.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      body: undefined,
    }));
  });

  it('adds X-Skip-Cache to an NPC access endpoint matching a configured suffix', async function() {
    await client.request('/games/demo/npcs/5/access.json', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/5/access.json', jasmine.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      body: undefined,
    }));
  });

  it('adds X-Skip-Cache to a session messages endpoint matching a configured suffix', async function() {
    await client.request('/games/demo/sessions/7/messages.json', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/sessions/7/messages.json', jasmine.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      body: undefined,
    }));
  });

  it('adds X-Skip-Cache to a suffix-matched endpoint that also has a query string', async function() {
    await client.request('/games/demo/pcs/2/access.json?foo=bar', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/access.json?foo=bar', jasmine.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      body: undefined,
    }));
  });

  it('does not add X-Skip-Cache to a path that merely contains a suffix but does not end with it', async function() {
    await client.request('/games/demo/pcs/2/access.json/extra', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/access.json/extra', jasmine.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json' },
      body: undefined,
    }));
  });

  it('adds X-Skip-Cache to a permissions.json request without a role param', async function() {
    await client.request('/games/demo/permissions.json', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/permissions.json', jasmine.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      body: undefined,
    }));
  });

  it('does not add X-Skip-Cache to a permissions.json request with a role param', async function() {
    await client.request('/games/demo/permissions.json?role=dm', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/permissions.json?role=dm', jasmine.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json' },
      body: undefined,
    }));
  });

  it('does not add X-Skip-Cache to a permissions.json request with several role params', async function() {
    await client.request('/games/demo/permissions.json?role=dm&role=player', {
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/permissions.json?role=dm&role=player', jasmine.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json' },
      body: undefined,
    }));
  });

  it('adds X-Skip-Cache to a permissions.json POST request even with a role param', async function() {
    await client.request('/games/demo/permissions.json?role=dm', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    expect(fetchSpy).toHaveBeenCalledWith('/games/demo/permissions.json?role=dm', jasmine.objectContaining({
      method: 'POST',
      headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      body: undefined,
    }));
  });
});
