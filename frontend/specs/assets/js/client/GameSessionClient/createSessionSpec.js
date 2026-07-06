import GameSessionClient from '../../../../../assets/js/client/GameSessionClient.js';

describe('GameSessionClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#createSession', function() {
    it('sends a POST request with the fields and auth token when present', async function() {
      const client = new GameSessionClient();

      await client.createSession('demo', 'tok-abc', { title: 'Session 1', date: '2024-01-01' });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/sessions.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ title: 'Session 1', date: '2024-01-01' }),
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new GameSessionClient();

      await client.createSession('demo', null, { title: 'Session 1', date: null });

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/sessions.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ title: 'Session 1', date: null }),
      });
    });
  });
});
