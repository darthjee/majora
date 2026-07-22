import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { stubAccessPair } from '../../../../../../../../support/accessStoreStub.js';
import { safeSet, buildController } from './support.js';

describe('CharacterController', function() {
  describe('#fetchAndMergeAccess', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('renders with the fail-closed defaults first, then merges the real access/permissions once AccessStore resolves', async function() {
      stubAccessPair(
        'ensureCharacterAccess', 'getCharacterAccess',
        { is_player: false, is_staff: false }, { is_player: false, is_staff: false },
      );
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: false }, { can_edit: false });
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter);

      const firstPass = controller.fetchAndMergeAccess({ id: 2, can_edit: true }, params, 'tok', safeSet);

      expect(firstPass).toEqual({
        id: 2, can_edit: false, is_player: false, is_staff: false, access_resolved: false,
      });
      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: false, is_player: false, is_staff: false, access_resolved: false,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(AccessStore.ensureCharacterAccess).toHaveBeenCalledWith('pcs', 'demo', '2');
      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('pcs', 'demo', '2');
      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: false, is_player: false, is_staff: false, access_resolved: true,
      });
    });

    it('merges is_player onto the character alongside can_edit once access resolves', async function() {
      stubAccessPair(
        'ensureCharacterAccess', 'getCharacterAccess',
        { is_player: true, is_staff: false }, { is_player: false, is_staff: false },
      );
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: false }, { can_edit: false });
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter);

      controller.fetchAndMergeAccess({ id: 2, can_edit: true }, params, 'tok', safeSet);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: false, is_player: true, is_staff: false, access_resolved: true,
      });
    });

    it('merges is_staff onto the character alongside can_edit once access resolves', async function() {
      stubAccessPair(
        'ensureCharacterAccess', 'getCharacterAccess',
        { is_player: false, is_staff: true }, { is_player: false, is_staff: false },
      );
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: false }, { can_edit: false });
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter);

      controller.fetchAndMergeAccess({ id: 2, can_edit: true }, params, 'tok', safeSet);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: false, is_player: false, is_staff: true, access_resolved: true,
      });
    });

    it('renders with the fail-closed default first when AccessStore has nothing cached yet', function() {
      stubAccessPair(
        'ensureCharacterAccess', 'getCharacterAccess',
        { is_player: false, is_staff: false }, { is_player: false, is_staff: false },
      );
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: false }, { can_edit: false });
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter);

      controller.fetchAndMergeAccess({ id: 2, can_edit: true }, params, null, safeSet);

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: false, is_player: false, is_staff: false, access_resolved: false,
      });
    });

    it('merges the real can_edit once resolved when it flips to true', async function() {
      stubAccessPair(
        'ensureCharacterAccess', 'getCharacterAccess',
        { is_player: false, is_staff: false }, { is_player: false, is_staff: false },
      );
      stubAccessPair('ensureCharacterPermissions', 'getCharacterPermissions', { can_edit: true }, { can_edit: false });
      const setCharacter = jasmine.createSpy('setCharacter');
      const controller = buildController(setCharacter);

      controller.fetchAndMergeAccess({ id: 2, can_edit: false, private_description: 'Secret notes.' }, params, 'tok', safeSet);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCharacter).toHaveBeenCalledWith({
        id: 2, can_edit: true, is_player: false, is_staff: false,
        private_description: 'Secret notes.', access_resolved: true,
      });
    });
  });
});
