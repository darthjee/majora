import { safeSet, buildController } from './support.js';

describe('CharacterController', function() {
  describe('#loadFullCharacter', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('sets the character without fetching full detail when can_edit is false', function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });
      const result = controller.loadFullCharacter({ id: 2, can_edit: false }, params, null, safeSet);

      expect(controller.fetchCharacterFull).not.toHaveBeenCalled();
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });
      expect(result).toBeUndefined();
    });

    it('fetches full detail when can_edit is true', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ private_description: 'Secret notes.' }),
        }),
      });

      await controller.loadFullCharacter({ id: 2, can_edit: true }, params, 'tok', safeSet);

      expect(controller.fetchCharacterFull).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: true, private_description: 'Secret notes.',
      });
    });

    it('merges slain and public_slain from the full detail, overriding the base character', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            slain: true, public_slain: false, allegiance: 'Loyal', public_allegiance: 'Unknown',
          }),
        }),
      });
      // The base character here mimics the public serializer, where `slain` was
      // aliased to the real `public_slain` value and `public_slain` was absent.
      const baseCharacter = { id: 2, can_edit: true, slain: false };

      await controller.loadFullCharacter(baseCharacter, params, 'tok', safeSet);

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2,
        can_edit: true,
        slain: true,
        public_slain: false,
        allegiance: 'Loyal',
        public_allegiance: 'Unknown',
      });
    });

    it('falls back to the base character when the full detail fetch response is not ok', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });
      const baseCharacter = { id: 2, can_edit: true, slain: false };

      await controller.loadFullCharacter(baseCharacter, params, 'tok', safeSet);

      expect(controller.fetchCharacterFull).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(setCharacter).toHaveBeenCalledWith(baseCharacter);
    });

    it('falls back to the base character when the full detail fetch rejects', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.reject(new Error('network error')),
      });
      const baseCharacter = { id: 2, can_edit: true, slain: false };

      await controller.loadFullCharacter(baseCharacter, params, 'tok', safeSet);

      expect(setCharacter).toHaveBeenCalledWith(baseCharacter);
    });
  });
});
