import GameSessionClient from '../../../../../assets/js/client/GameSessionClient.js';

describe('GameSessionClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#fetchSession', function() {
    it('sends the auth token when present', async function() {
      const client = new GameSessionClient();

      await client.fetchSession('demo', 42, 'tok-abc');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/sessions/42.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token tok-abc',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new GameSessionClient();

      await client.fetchSession('demo', 42, null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/sessions/42.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        body: undefined,
      });
    });
  });
});
