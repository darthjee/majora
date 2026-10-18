import BaseClient from '../../../../../assets/js/client/BaseClient.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('BaseClient skip-cache for API token endpoints (issue #1605)', function() {
  let fetchSpy;
  let client;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
    client = new BaseClient();
  });

  [
    '/account/api_tokens.json',
    '/account/api_tokens/options.json',
    '/account/api_tokens/12.json',
  ].forEach((path) => {
    it(`adds X-Skip-Cache to a GET on ${path}`, async function() {
      await client.request(path, { headers: { Accept: 'application/json' } });

      expect(fetchSpy).toHaveBeenCalledWith(path, jasmine.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json', 'X-Skip-Cache': 'true' },
      }));
    });
  });
});
