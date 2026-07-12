import Noop from '../../../../../../../assets/js/utils/Noop.js';
import AccessStore from '../../../../../../../assets/js/utils/AccessStore.js';
import { StubCharacterController, safeSet, buildController } from './support.js';

describe('CharacterController', function() {
  describe('#loadCharacter', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('fetches the character and merges access on success', async function() {
      spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ is_player: false }));
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: false }));
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacter: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 2 }),
        }),
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      await controller.loadCharacter(params, safeSet);

      expect(controller.fetchCharacter).toHaveBeenCalledWith('demo', '2', null);
      expect(setCharacter).toHaveBeenCalledWith({ id: 2, treasures: [], can_edit: false, is_player: false });
    });

    it('merges slain and public_slain from the full character fetch when the user can edit', async function() {
      spyOn(AccessStore, 'ensureCharacterAccess').and.returnValue(Promise.resolve({ is_player: false }));
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        // Mimics the public CharacterDetailSerializer: `slain` aliased to the real
        // `public_slain` value, and `public_slain` itself absent.
        fetchCharacter: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 2, slain: false }),
        }),
        fetchCharacterFull: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ slain: true, public_slain: false }),
        }),
      });

      await controller.loadCharacter(params, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, treasures: [], can_edit: true, is_player: false, slain: true, public_slain: false,
      });
    });

    it('calls setError when the character fetch response is not ok', async function() {
      const setError = jasmine.createSpy('setError');
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = new StubCharacterController(
        setCharacter,
        Noop.noop,
        setError,
        () => params,
        null,
      );
      spyOn(controller, 'fetchCharacter').and.returnValue(Promise.resolve({ ok: false }));

      await controller.loadCharacter(params, safeSet);

      expect(setError).toHaveBeenCalledWith('Unable to load character.');
    });

    it('calls setLoading with false after the fetch chain completes', async function() {
      const setLoading = jasmine.createSpy('setLoading');
      const controller = new StubCharacterController(
        Noop.noop,
        setLoading,
        Noop.noop,
        () => params,
        null,
      );
      spyOn(controller, 'fetchCharacter').and.returnValue(Promise.resolve({ ok: false }));

      await controller.loadCharacter(params, safeSet);

      expect(setLoading).toHaveBeenCalledWith(false);
    });
  });
});
