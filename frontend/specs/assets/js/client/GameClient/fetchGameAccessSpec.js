import GameClient from '../../../../../assets/js/client/GameClient.js';

describe('GameClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#fetchGameAccess', function() {
    it('sends the auth token and X-Skip-Cache header when present', async function() {
      const client = new GameClient();

      await client.fetchGameAccess('demo', 'tok-abc');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/access.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new GameClient();

      await client.fetchGameAccess('demo', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/access.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: undefined,
      });
    });
  });
});
