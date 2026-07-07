import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';

describe('CharacterClient photo roles', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = spyOn(globalThis, 'fetch');
    fetchSpy.and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
  });

  describe('#setPhotoRoles', function() {
    it('sends the roles and auth token when present for a PC', async function() {
      const client = new CharacterClient();

      await client.setPhotoRoles('pcs', 'demo', '2', '9', 'abc123', ['profile']);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/photos/9/set.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ roles: ['profile'] }),
      });
    });

    it('omits the Authorization header when there is no token for a PC', async function() {
      const client = new CharacterClient();

      await client.setPhotoRoles('pcs', 'demo', '2', '9', null, ['profile']);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/photos/9/set.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ roles: ['profile'] }),
      });
    });

    it('sends the roles and auth token when present for an NPC', async function() {
      const client = new CharacterClient();

      await client.setPhotoRoles('npcs', 'demo', '2', '9', 'abc123', ['profile']);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/photos/9/set.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Token abc123',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ roles: ['profile'] }),
      });
    });

    it('omits the Authorization header when there is no token for an NPC', async function() {
      const client = new CharacterClient();

      await client.setPhotoRoles('npcs', 'demo', '2', '9', null, ['profile']);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/photos/9/set.json', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Skip-Cache': 'true',
        },
        body: JSON.stringify({ roles: ['profile'] }),
      });
    });
  });
});
