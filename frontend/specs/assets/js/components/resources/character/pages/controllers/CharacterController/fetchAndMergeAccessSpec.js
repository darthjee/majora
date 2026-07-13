import AccessStore from '../../../../../../../../../assets/js/utils/AccessStore.js';
import { safeSet, buildController } from './support.js';

describe('CharacterController', function() {
  describe('#fetchAndMergeAccess', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('resolves access/permissions through AccessStore and merges can_edit onto the character', async function() {
      spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ is_player: false }));
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      await controller.fetchAndMergeAccess({ id: 2, can_edit: true }, params, 'tok', safeSet);

      expect(AccessStore.ensureCharacterAccess).toHaveBeenCalledWith('pcs', 'demo', '2');
      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('pcs', 'demo', '2');
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false, is_player: false });
    });

    it('merges is_player onto the character alongside can_edit', async function() {
      spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ is_player: true }));
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      await controller.fetchAndMergeAccess({ id: 2, can_edit: true }, params, 'tok', safeSet);

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false, is_player: true });
    });

    it('resolves with the fail-closed default when AccessStore fails closed', async function() {
      spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ is_player: false }));
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      await controller.fetchAndMergeAccess({ id: 2, can_edit: true }, params, null, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({ id: 2, can_edit: false, is_player: false });
      expect(controller.fetchCharacterFull).not.toHaveBeenCalled();
    });

    it('calls loadFullCharacter with the merged character', async function() {
      spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ is_player: false }));
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ private_description: 'Secret notes.' }),
        }),
      });

      await controller.fetchAndMergeAccess({ id: 2, can_edit: false }, params, 'tok', safeSet);

      expect(controller.fetchCharacterFull).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: true, is_player: false, private_description: 'Secret notes.',
      });
    });
  });
});
