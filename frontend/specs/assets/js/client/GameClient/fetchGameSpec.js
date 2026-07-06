import GameClient from '../../../../../assets/js/client/GameClient.js';

describe('GameClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#fetchGame', function() {
    it('sends the auth token when present', async function() {
      const client = new GameClient();

      await client.fetchGame('demo', 'tok-abc');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token tok-abc',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new GameClient();

      await client.fetchGame('demo', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        body: undefined,
      });
    });
  });
});
