import GameClient from '../../../../../assets/js/client/GameClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('GameClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchFactionPermissions', function() {
    itSendsAuthHeader({
      call: (token) => new GameClient().fetchFactionPermissions('demo', token),
      url: '/permissions/game_faction.json',
      headers: { 'X-Skip-Cache': 'true' },
      token: 'tok-abc',
    });

    it('serializes a single role as a role= query param and omits X-Skip-Cache', async function() {
      await new GameClient().fetchFactionPermissions('demo', null, undefined, ['dm']);

      expect(fetchSpy).toHaveBeenCalledWith('/permissions/game_faction.json?role=dm', jasmine.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
        body: undefined,
      }));
    });

    it('serializes several roles as repeated role= query params', async function() {
      await new GameClient().fetchFactionPermissions('demo', null, undefined, ['dm', 'player']);

      expect(fetchSpy).toHaveBeenCalledWith(
        '/permissions/game_faction.json?role=dm&role=player',
        jasmine.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
          body: undefined,
        }),
      );
    });
  });
});
