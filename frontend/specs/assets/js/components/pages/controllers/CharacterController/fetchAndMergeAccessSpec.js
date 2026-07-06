import { safeSet, buildController } from './support.js';

describe('CharacterController', function() {
  describe('#fetchAndMergeAccess', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('fetches access and merges can_edit onto the character', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterAccess: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ can_edit: false }),
        }),
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      await controller.fetchAndMergeAccess({ id: 2, can_edit: true }, params, 'tok', safeSet);

      expect(controller.fetchCharacterAccess).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });
    });

    it('falls back to original character when access endpoint returns non-ok', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterAccess: () => Promise.resolve({ ok: false }),
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      await controller.fetchAndMergeAccess({ id: 2, can_edit: false }, params, null, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });
      expect(controller.fetchCharacterFull).not.toHaveBeenCalled();
    });

    it('falls back to original character when access endpoint throws', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterAccess: () => Promise.reject(new Error('Network error')),
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      await controller.fetchAndMergeAccess({ id: 2, can_edit: false }, params, null, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false });
      expect(controller.fetchCharacterFull).not.toHaveBeenCalled();
    });

    it('calls loadFullCharacter with the merged character', async function() {
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterAccess: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ can_edit: true }),
        }),
        fetchCharacterFull: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ private_description: 'Secret notes.' }),
        }),
      });

      await controller.fetchAndMergeAccess({ id: 2, can_edit: false }, params, 'tok', safeSet);

      expect(controller.fetchCharacterFull).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: true, private_description: 'Secret notes.' });
    });
  });
});
