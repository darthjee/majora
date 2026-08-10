import BaseClient from '../../../../../assets/js/client/BaseClient.js';
import AuthStorage from '../../../../../assets/js/utils/auth/AuthStorage.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('BaseClient', function() {
  let fetchSpy;
  let client;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
    client = new BaseClient();
  });

  afterEach(function() {
    AuthStorage.clearCacheToken();
  });

  it('adds X-Cache-Token when a cache token is stored', async function() {
    AuthStorage.setCacheToken('cache-tok-123');

    await client.getJson('/some/other.json', null);

    expect(fetchSpy).toHaveBeenCalledWith('/some/other.json', jasmine.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json', 'X-Cache-Token': 'cache-tok-123' },
      body: undefined,
    }));
  });

  it('omits X-Cache-Token when no cache token is stored', async function() {
    await client.getJson('/some/other.json', null);

    expect(fetchSpy).toHaveBeenCalledWith('/some/other.json', jasmine.objectContaining({
      method: 'GET',
      headers: { Accept: 'application/json' },
      body: undefined,
    }));
  });

  it('includes X-Cache-Token via buildHeaders alongside the Authorization header', function() {
    AuthStorage.setCacheToken('cache-tok-abc');

    const headers = client.buildHeaders('auth-tok-1');

    expect(headers).toEqual({
      Accept: 'application/json',
      Authorization: 'Token auth-tok-1',
      'X-Cache-Token': 'cache-tok-abc',
    });
  });

  it('lets extraHeaders override X-Cache-Token when explicitly provided', function() {
    AuthStorage.setCacheToken('cache-tok-abc');

    const headers = client.buildHeaders(null, { 'X-Cache-Token': 'override' });

    expect(headers).toEqual({
      Accept: 'application/json',
      'X-Cache-Token': 'override',
    });
  });
});
