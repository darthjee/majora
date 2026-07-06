import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient slain', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#setNpcSlain', function() {
    it('sends the slain flag and auth token when present', async function() {
      const client = new CharacterClient();

      await client.setNpcSlain('demo', '2', 'abc123', true);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/slain.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ slain: true }),
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new CharacterClient();

      await client.setNpcSlain('demo', '2', null, false);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/slain.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ slain: false }),
      });
    });
  });
});
