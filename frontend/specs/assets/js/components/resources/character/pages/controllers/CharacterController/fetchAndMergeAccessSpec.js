import AccessStore from '../../../../../../../../../assets/js/utils/AccessStore.js';
import { stubAccessPair } from '../../../../../../../../support/accessStoreStub.js';
import { safeSet, buildController } from './support.js';

describe('CharacterController', function() {
  describe('#fetchAndMergeAccess', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('renders with the fail-closed defaults first, then merges the real access/permissions once AccessStore resolves', async function() {
      stubAccessPair('ensureCharacterAccess', 'getCharacterAccess', { is_player: false }, { is_player: false });
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: false }, { can_edit: false });
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      controller.fetchAndMergeAccess({ id: 2, can_edit: true }, params, 'tok', safeSet);

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: false, is_player: false, access_resolved: false,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureCharacterAccess).toHaveBeenCalledWith('pcs', 'demo', '2');
      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('pcs', 'demo', '2');
      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: false, is_player: false, access_resolved: true,
      });
    });

    it('merges is_player onto the character alongside can_edit once access resolves', async function() {
      stubAccessPair('ensureCharacterAccess', 'getCharacterAccess', { is_player: true }, { is_player: false });
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: false }, { can_edit: false });
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      controller.fetchAndMergeAccess({ id: 2, can_edit: true }, params, 'tok', safeSet);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: false, is_player: true, access_resolved: true,
      });
    });

    it('renders with the fail-closed default first when AccessStore has nothing cached yet', function() {
      stubAccessPair('ensureCharacterAccess', 'getCharacterAccess', { is_player: false }, { is_player: false });
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: false }, { can_edit: false });
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      controller.fetchAndMergeAccess({ id: 2, can_edit: true }, params, null, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: false, is_player: false, access_resolved: false,
      });
      expect(controller.fetchCharacterFull).not.toHaveBeenCalled();
    });

    it('does not fetch full detail once resolved when can_edit stays false', async function() {
      stubAccessPair('ensureCharacterAccess', 'getCharacterAccess', { is_player: false }, { is_player: false });
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: false }, { can_edit: false });
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({ ok: false }),
      });

      controller.fetchAndMergeAccess({ id: 2, can_edit: true }, params, null, safeSet);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: false, is_player: false, access_resolved: true,
      });
      expect(controller.fetchCharacterFull).not.toHaveBeenCalled();
    });

    it('calls loadFullCharacter with the merged character once the resolved can_edit flips to true', async function() {
      stubAccessPair('ensureCharacterAccess', 'getCharacterAccess', { is_player: false }, { is_player: false });
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: true }, { can_edit: false });
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter, {
        fetchCharacterFull: () => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ private_description: 'Secret notes.' }),
        }),
      });

      controller.fetchAndMergeAccess({ id: 2, can_edit: false }, params, 'tok', safeSet);

      expect(controller.fetchCharacterFull).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(controller.fetchCharacterFull).toHaveBeenCalledWith('demo', '2', 'tok');
      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: true, is_player: false, private_description: 'Secret notes.', access_resolved: true,
      });
    });
  });
});
