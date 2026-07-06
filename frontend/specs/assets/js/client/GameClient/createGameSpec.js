import GameClient from '../../../../../assets/js/client/GameClient.js';

describe('GameClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#createGame', function() {
    it('sends a POST request with the fields and auth token when present', async function() {
      const client = new GameClient();

      await client.createGame('tok-abc', { name: 'New Game' });

      expect(fetchSpy).toHaveBeenCalledWith('/games.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'New Game' }),
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new GameClient();

      await client.createGame(null, { name: 'New Game' });

      expect(fetchSpy).toHaveBeenCalledWith('/games.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'New Game' }),
      });
    });
  });
});
