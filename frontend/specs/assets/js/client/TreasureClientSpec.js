import TreasureClient from '../../../../assets/js/client/TreasureClient.js';

describe('TreasureClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#fetchTreasure', function() {
    it('sends the auth token when present', async function() {
      const client = new TreasureClient();

      await client.fetchTreasure(42, 'tok-abc');

      expect(fetchSpy).toHaveBeenCalledWith('/treasures/42.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token tok-abc',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new TreasureClient();

      await client.fetchTreasure(42, null);

      expect(fetchSpy).toHaveBeenCalledWith('/treasures/42.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        body: undefined,
      });
    });
  });

  describe('#fetchTreasureAccess', function() {
    it('sends the auth token and X-Skip-Cache header when present', async function() {
      const client = new TreasureClient();

      await client.fetchTreasureAccess(42, 'tok-abc');

      expect(fetchSpy).toHaveBeenCalledWith('/treasures/42/access.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': '1',
        },
        body: undefined,
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new TreasureClient();

      await client.fetchTreasureAccess(42, null);

      expect(fetchSpy).toHaveBeenCalledWith('/treasures/42/access.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Skip-Cache': '1',
        },
        body: undefined,
      });
    });
  });

  describe('#createTreasure', function() {
    it('sends a POST request with the fields and auth token when present', async function() {
      const client = new TreasureClient();

      await client.createTreasure('tok-abc', { name: 'Sword', value: 100 });

      expect(fetchSpy).toHaveBeenCalledWith('/treasures.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': '1',
        },
        body: JSON.stringify({ name: 'Sword', value: 100 }),
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new TreasureClient();

      await client.createTreasure(null, { name: 'Sword', value: 100 });

      expect(fetchSpy).toHaveBeenCalledWith('/treasures.json', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': '1',
        },
        body: JSON.stringify({ name: 'Sword', value: 100 }),
      });
    });
  });

  describe('#updateTreasure', function() {
    it('sends a PATCH request with the fields and auth token when present', async function() {
      const client = new TreasureClient();

      await client.updateTreasure(42, 'tok-abc', { name: 'Golden Sword' });

      expect(fetchSpy).toHaveBeenCalledWith('/treasures/42.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token tok-abc',
          'X-Skip-Cache': '1',
        },
        body: JSON.stringify({ name: 'Golden Sword' }),
      });
    });

    it('omits the Authorization header when there is no token', async function() {
      const client = new TreasureClient();

      await client.updateTreasure(42, null, { name: 'Golden Sword' });

      expect(fetchSpy).toHaveBeenCalledWith('/treasures/42.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': '1',
        },
        body: JSON.stringify({ name: 'Golden Sword' }),
      });
    });
  });
});
