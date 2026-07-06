import GameClient from '../../../../../assets/js/client/GameClient.js';

describe('GameClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#updateGame', function() {
    it('sends a PATCH request with the fields and auth token when present', async function() {
      const client = new GameClient();

      await client.updateGame('demo', 'tok-abc', { name: 'New Name' });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'New Name' }),
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new GameClient();

      await client.updateGame('demo', null, { name: 'New Name' });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ name: 'New Name' }),
      });
    });
  });
});
