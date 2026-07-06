import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#fetchPc', function() {
    it('sends the auth token when present', async function() {
      const client = new CharacterClient();

      await client.fetchPc('demo', '2', 'abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new CharacterClient();

      await client.fetchPc('demo', '2', null);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        body: undefined,
      });
    });

    it('does not send the X-Skip-Cache header', async function() {
      const client = new CharacterClient();

      await client.fetchPc('demo', '2', 'abc123');

      const [, options] = fetchSpy.calls.mostRecent().args;
      expect(options.headers['X-Skip-Cache']).toBeUndefined();
    });
  });
});
