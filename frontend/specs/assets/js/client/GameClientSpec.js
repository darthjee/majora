import GameClient from '../../../../assets/js/client/GameClient.js';

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
