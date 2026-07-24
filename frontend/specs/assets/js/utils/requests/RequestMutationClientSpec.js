import RequestMutationClient from '../../../../../assets/js/utils/requests/RequestMutationClient.js';
import AuthStorage from '../../../../../assets/js/utils/auth/AuthStorage.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('RequestMutationClient', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#mutate', function() {
    it('fires a PATCH request with a JSON body and Content-Type header', async function() {
      await new RequestMutationClient().mutate('PATCH', '/games/demo/npcs/2.json', { name: 'New name' }, 'tok');

      expect(globalThis.fetch).toHaveBeenCalledWith('/games/demo/npcs/2.json', jasmine.objectContaining({
        method: 'PATCH',
        headers: {
          Accept: 'application/json', Authorization: 'Token tok', 'Content-Type': 'application/json', 'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'New name' }),
      }));
    });

    it('fires a POST request', async function() {
      await new RequestMutationClient().mutate('POST', '/games/demo/npcs.json', { name: 'Goblin' }, 'tok');

      expect(globalThis.fetch).toHaveBeenCalledWith('/games/demo/npcs.json', jasmine.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Goblin' }),
      }));
    });

    it('fires a PUT request', async function() {
      await new RequestMutationClient().mutate('PUT', '/games/demo/npcs/2/money.json', { money: 100 }, 'tok');

      expect(globalThis.fetch).toHaveBeenCalledWith('/games/demo/npcs/2/money.json', jasmine.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ money: 100 }),
      }));
    });

    it('defaults the body to an empty object when none is given', async function() {
      await new RequestMutationClient().mutate('PATCH', '/games/demo/npcs/2.json', undefined, 'tok');

      expect(globalThis.fetch).toHaveBeenCalledWith('/games/demo/npcs/2.json', jasmine.objectContaining({
        body: JSON.stringify({}),
      }));
    });

    it('rejects for an unsupported method, without calling fetch', async function() {
      await expectAsync(
        new RequestMutationClient().mutate('DELETE', '/games/demo/npcs/2.json', {}, 'tok')
      ).toBeRejected();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    itSendsAuthHeader({
      call: (token) => new RequestMutationClient().mutate('PATCH', '/games/demo/npcs/2.json', { name: 'x' }, token),
      url: '/games/demo/npcs/2.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
      body: JSON.stringify({ name: 'x' }),
    });
  });
});
