import GameClient from '../../../../../assets/js/client/GameClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchGamePermissions', function() {
    itSendsAuthHeader({
      call: (token) => new GameClient().fetchGamePermissions('demo', token),
      url: '/games/demo/permissions.json',
      headers: { 'X-Skip-Cache': 'true' },
      token: 'tok-abc',
    });

    it('serializes a single role as a role= query param and omits X-Skip-Cache', async function() {
      await new GameClient().fetchGamePermissions('demo', null, undefined, ['dm']);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/permissions.json?role=dm', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        body: undefined,
      });
    });

    it('serializes several roles as repeated role= query params', async function() {
      await new GameClient().fetchGamePermissions('demo', null, undefined, ['dm', 'player']);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/permissions.json?role=dm&role=player', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        body: undefined,
      });
    });
  });
});
