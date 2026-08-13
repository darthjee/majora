import GameClient from '../../../../../assets/js/client/GameClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchItemPermissions', function() {
    itSendsAuthHeader({
      call: (token) => new GameClient().fetchItemPermissions('demo', token),
      url: '/permissions/game_item.json',
      headers: { 'X-Skip-Cache': 'true' },
      token: 'tok-abc',
    });

    it('serializes a single role as a role= query param and omits X-Skip-Cache', async function() {
      await new GameClient().fetchItemPermissions('demo', null, undefined, ['dm']);

      expect(fetchSpy).toHaveBeenCalledWith('/permissions/game_item.json?role=dm', jasmine.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
        body: undefined,
      }));
    });

    it('serializes several roles as repeated role= query params', async function() {
      await new GameClient().fetchItemPermissions('demo', null, undefined, ['dm', 'player']);

      expect(fetchSpy).toHaveBeenCalledWith(
        '/permissions/game_item.json?role=dm&role=player',
        jasmine.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
          body: undefined,
        }),
      );
    });
  });
});
