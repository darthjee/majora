import { safeSet, buildController } from './support.js';

describe('CharacterController', function() {
  describe('#mergePrivateDescription', function() {
    it('merges the private description into the character', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter);
      const fullResponse = { json: () => Promise.resolve({ private_description: 'Secret notes.' }) };

      await controller.mergePrivateDescription(fullResponse, { id: 2 }, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, private_description: 'Secret notes.' });
    });
  });
});
