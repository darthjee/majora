import RequestClient from '../../../../../assets/js/utils/requests/RequestClient.js';
import AuthStorage from '../../../../../assets/js/utils/auth/AuthStorage.js';
import { stubFetchJson } from '../../../../support/fetchMock.js';

describe('RequestClient', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#fetchResource', function() {
    it('fetches and parses the given path as JSON', async function() {
      stubFetchJson({ id: 1 });

      const result = await new RequestClient().fetchResource('/games/demo/npcs.json');

      expect(globalThis.fetch).toHaveBeenCalledWith('/games/demo/npcs.json', jasmine.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
      }));
      expect(result).toEqual({ id: 1 });
    });

    it('sends the auth token when present', async function() {
      stubFetchJson({ id: 1 });
      AuthStorage.setToken('abc123');

      await new RequestClient().fetchResource('/games/demo/npcs.json');

      expect(globalThis.fetch).toHaveBeenCalledWith('/games/demo/npcs.json', jasmine.objectContaining({
        headers: { Accept: 'application/json', Authorization: 'Token abc123' },
      }));
    });

    it('passes the signal through when given', async function() {
      stubFetchJson({ id: 1 });
      const controller = new AbortController();

      await new RequestClient().fetchResource('/games/demo/npcs.json', {}, controller.signal);

      expect(globalThis.fetch).toHaveBeenCalledWith('/games/demo/npcs.json', jasmine.objectContaining({
        signal: controller.signal,
      }));
    });

    it('rejects when the response is not ok', async function() {
      stubFetchJson({}, { ok: false });

      await expectAsync(new RequestClient().fetchResource('/games/demo/npcs.json')).toBeRejected();
    });

    it('does not append a query string when the query is empty', async function() {
      stubFetchJson({ id: 1 });

      await new RequestClient().fetchResource('/games/demo/npcs.json', {});

      expect(globalThis.fetch).toHaveBeenCalledWith('/games/demo/npcs.json', jasmine.anything());
    });

    it('appends a correctly-encoded query string when the query is non-empty', async function() {
      stubFetchJson({ id: 1 });

      await new RequestClient().fetchResource('/games/demo/npcs.json', { page: 2, per_page: 10 });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/games/demo/npcs.json?page=2&per_page=10', jasmine.anything()
      );
    });

    it('omits blank/undefined/null query values from the query string', async function() {
      stubFetchJson({ id: 1 });

      await new RequestClient().fetchResource('/games/demo/npcs.json', { page: 2, name: '', kind: undefined });

      expect(globalThis.fetch).toHaveBeenCalledWith('/games/demo/npcs.json?page=2', jasmine.anything());
    });
  });
});
