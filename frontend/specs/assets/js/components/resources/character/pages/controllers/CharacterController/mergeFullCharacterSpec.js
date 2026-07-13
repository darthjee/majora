import { safeSet, buildController } from './support.js';

describe('CharacterController', function() {
  describe('#mergeFullCharacter', function() {
    it('merges the private description into the character', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter);
      const fullResponse = { json: () => Promise.resolve({ private_description: 'Secret notes.' }) };

      await controller.mergeFullCharacter(fullResponse, { id: 2 }, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, private_description: 'Secret notes.' });
    });

    it('merges slain, public_slain, allegiance and public_allegiance from the full response', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter);
      const fullResponse = {
        json: () => Promise.resolve({
          slain: true,
          public_slain: false,
          allegiance: 'Loyal',
          public_allegiance: 'Unknown',
          private_description: 'Secret notes.',
        }),
      };
      const character = {
        id: 2, name: 'Grommash', slain: false, public_slain: false, can_edit: true,
      };

      await controller.mergeFullCharacter(fullResponse, character, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2,
        name: 'Grommash',
        can_edit: true,
        slain: true,
        public_slain: false,
        allegiance: 'Loyal',
        public_allegiance: 'Unknown',
        private_description: 'Secret notes.',
      });
    });

    it('overrides the public-serializer slain value aliased onto the base character', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter);
      // The public serializer aliases `slain` to the real `public_slain` value and
      // never exposes `public_slain` at all; the full response is authoritative here.
      const character = { id: 2, slain: true };
      const fullResponse = {
        json: () => Promise.resolve({ slain: false, public_slain: true }),
      };

      await controller.mergeFullCharacter(fullResponse, character, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, slain: false, public_slain: true });
    });
  });
});
