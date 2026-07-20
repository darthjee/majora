import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchCharacterPhotos', function() {
    describe('for a PC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterPhotos('pcs', 'demo', '2', token),
        url: '/games/demo/pcs/2/photos.json?per_page=11',
      });
    });

    describe('for an NPC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterPhotos('npcs', 'demo', '2', token),
        url: '/games/demo/npcs/2/photos.json?per_page=11',
      });
    });

    it('defaults per_page to 11 when not provided', async function() {
      const client = new CharacterClient();

      await client.fetchCharacterPhotos('pcs', 'demo', '2', 'abc123');

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/pcs/2/photos.json?per_page=11', jasmine.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
        },
        body: undefined,
      }));
    });

    it('requests a custom per_page value when provided', async function() {
      const client = new CharacterClient();

      await client.fetchCharacterPhotos('npcs', 'demo', '2', 'abc123', 10);

      expect(fetchSpy).toHaveBeenCalledWith('/games/demo/npcs/2/photos.json?per_page=10', jasmine.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Token abc123',
        },
        body: undefined,
      }));
    });

    it('resolves to the fetch response', async function() {
      const client = new CharacterClient();

      const response = await client.fetchCharacterPhotos('pcs', 'demo', '2', 'abc123');

      expect(response.ok).toBeTrue();
    });
  });
});
