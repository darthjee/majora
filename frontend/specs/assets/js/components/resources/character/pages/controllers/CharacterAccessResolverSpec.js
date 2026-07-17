import CharacterAccessResolver
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterAccessResolver.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('CharacterAccessResolver', function() {
  describe('.merge', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('merges can_edit, is_player, and is_staff onto the character', function() {
      spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: true, is_staff: false });
      spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({ can_edit: true });

      const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, false);

      expect(result).toEqual({
        id: 2, can_edit: true, is_player: true, is_staff: false, access_resolved: false,
      });
    });

    it('coerces is_staff to a boolean', function() {
      spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: undefined });
      spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({ can_edit: false });

      const result = CharacterAccessResolver.merge('npcs', { id: 3 }, params, true);

      expect(result.is_staff).toBe(false);
    });

    it('passes the characterKind and route params through to AccessStore', function() {
      const getAccess = spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
      const getPermissions = spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({ can_edit: false });

      CharacterAccessResolver.merge('npcs', { id: 3 }, params, true);

      expect(getAccess).toHaveBeenCalledWith('npcs', 'demo', '2');
      expect(getPermissions).toHaveBeenCalledWith('npcs', 'demo', '2');
    });

    it('marks the result as resolved when passed true', function() {
      spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
      spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({ can_edit: false });

      const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, true);

      expect(result.access_resolved).toBe(true);
    });
  });
});
