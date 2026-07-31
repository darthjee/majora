import TreasureClient from '../../../../../assets/js/client/TreasureClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('TreasureClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchTreasurePermissions', function() {
    describe('for a global treasure (isExclusive omitted/false)', function() {
      itSendsAuthHeader({
        call: (token) => new TreasureClient().fetchTreasurePermissions(42, token),
        url: '/permissions/treasure.json',
        headers: { 'X-Skip-Cache': 'true' },
        token: 'tok-abc',
      });

      it('serializes roles as repeated role= query params', async function() {
        await new TreasureClient().fetchTreasurePermissions(42, null, undefined, ['superuser']);

        expect(fetchSpy).toHaveBeenCalledWith('/permissions/treasure.json?role=superuser', jasmine.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
          body: undefined,
        }));
      });
    });

    describe('for a game-exclusive treasure (isExclusive true)', function() {
      itSendsAuthHeader({
        call: (token) => new TreasureClient().fetchTreasurePermissions(42, token, undefined, [], true),
        url: '/permissions/game_treasure.json',
        headers: { 'X-Skip-Cache': 'true' },
        token: 'tok-abc',
      });

      it('serializes roles as repeated role= query params', async function() {
        await new TreasureClient().fetchTreasurePermissions(42, null, undefined, ['superuser'], true);

        expect(fetchSpy).toHaveBeenCalledWith(
          '/permissions/game_treasure.json?role=superuser',
          jasmine.objectContaining({
            method: 'GET',
            headers: { Accept: 'application/json' },
            body: undefined,
          }),
        );
      });
    });
  });
});
