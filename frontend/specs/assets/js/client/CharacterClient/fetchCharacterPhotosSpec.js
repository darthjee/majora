import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient', function() {
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = stubFetchJson();
  });

  describe('#fetchCharacterPhotos', function() {
    describe('for the plain gallery path', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterPhotos('/games/demo/pcs/2/photos.json', token),
        url: '/games/demo/pcs/2/photos.json?per_page=11',
      });
    });

    describe('for the restricted NPC gallery path', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().fetchCharacterPhotos('/games/demo/npcs/2/photos/all.json', token),
        url: '/games/demo/npcs/2/photos/all.json?per_page=11',
        headers: { 'X-Skip-Cache': 'true' },
      });
    });

    it('requests a custom per_page value when provided', async function() {
      await new CharacterClient().fetchCharacterPhotos('/games/demo/npcs/2/photos.json', 'abc123', 10);

      expect(fetchSpy).toHaveBeenCalledWith(
        '/games/demo/npcs/2/photos.json?per_page=10', jasmine.objectContaining({ method: 'GET' }),
      );
    });

    it('resolves to the fetch response', async function() {
      const response = await new CharacterClient().fetchCharacterPhotos('/games/demo/pcs/2/photos.json', 'abc123');

      expect(response.ok).toBeTrue();
    });
  });
});
