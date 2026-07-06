import GameSessionClient from '../../../../../assets/js/client/GameSessionClient.js';

describe('GameSessionClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#updateSession', function() {
    it('sends a PATCH request with the fields and auth token when present', async function() {
      const client = new GameSessionClient();

      await client.updateSession('demo', 42, 'tok-abc', { title: 'Session 1 renamed' });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/sessions/42.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ title: 'Session 1 renamed' }),
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new GameSessionClient();

      await client.updateSession('demo', 42, null, { title: 'Session 1 renamed' });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/sessions/42.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ title: 'Session 1 renamed' }),
      });
    });
  });
});
