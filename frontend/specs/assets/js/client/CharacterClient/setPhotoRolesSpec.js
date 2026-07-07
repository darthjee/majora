import CharacterClient from '../../../../../assets/js/client/CharacterClient.js';
import { stubFetchJson, itSendsAuthHeader } from '../../../../support/fetchMock.js';

describe('CharacterClient photo roles', function() {
  beforeEach(function() {
    stubFetchJson();
  });

  describe('#setPhotoRoles', function() {
    describe('for a PC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().setPhotoRoles('pcs', 'demo', '2', '9', token, ['profile']),
        url: '/games/demo/pcs/2/photos/9/set.json',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
        body: JSON.stringify({ roles: ['profile'] }),
      });
    });

    describe('for an NPC', function() {
      itSendsAuthHeader({
        call: (token) => new CharacterClient().setPhotoRoles('npcs', 'demo', '2', '9', token, ['profile']),
        url: '/games/demo/npcs/2/photos/9/set.json',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Skip-Cache': 'true' },
        body: JSON.stringify({ roles: ['profile'] }),
      });
    });
  });
});
