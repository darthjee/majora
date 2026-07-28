import CharacterAccessResolver
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterAccessResolver.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('CharacterAccessResolver', function() {
  describe('.merge', function() {
    const params = { game_slug: 'demo', character_id: '2' };

    it('merges can_edit, is_player, and is_staff onto the character', function() {
      spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: true, is_staff: false });
      spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({
        can_edit: true,
        can_edit_money: true,
        can_exchange_treasure: true,
        can_set_profile_photo: true,
        can_delete_photo: true,
      });

      const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, false);

      expect(result).toEqual({
        id: 2,
        can_edit: true,
        can_edit_money: true,
        can_exchange_treasure: true,
        can_set_profile_photo: true,
        can_delete_photo: true,
        is_player: true,
        is_staff: false,
        access_resolved: false,
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

    describe('can_edit_money coercion', function() {
      it('keeps can_edit_money true when present', function() {
        spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
        spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({ can_edit_money: true });

        const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, true);

        expect(result.can_edit_money).toBe(true);
      });

      it('defaults can_edit_money to false when missing', function() {
        spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
        spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({});

        const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, true);

        expect(result.can_edit_money).toBe(false);
      });

      it('coerces a falsy-but-defined can_edit_money to false', function() {
        spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
        spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({ can_edit_money: 0 });

        const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, true);

        expect(result.can_edit_money).toBe(false);
      });
    });

    describe('can_exchange_treasure coercion', function() {
      it('keeps can_exchange_treasure true when present', function() {
        spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
        spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({ can_exchange_treasure: true });

        const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, true);

        expect(result.can_exchange_treasure).toBe(true);
      });

      it('defaults can_exchange_treasure to false when missing', function() {
        spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
        spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({});

        const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, true);

        expect(result.can_exchange_treasure).toBe(false);
      });

      it('coerces a falsy-but-defined can_exchange_treasure to false', function() {
        spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
        spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({ can_exchange_treasure: 0 });

        const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, true);

        expect(result.can_exchange_treasure).toBe(false);
      });
    });

    describe('can_set_profile_photo coercion', function() {
      it('keeps can_set_profile_photo true when present', function() {
        spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
        spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({ can_set_profile_photo: true });

        const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, true);

        expect(result.can_set_profile_photo).toBe(true);
      });

      it('defaults can_set_profile_photo to false when missing', function() {
        spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
        spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({});

        const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, true);

        expect(result.can_set_profile_photo).toBe(false);
      });

      it('coerces a falsy-but-defined can_set_profile_photo to false', function() {
        spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
        spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({ can_set_profile_photo: 0 });

        const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, true);

        expect(result.can_set_profile_photo).toBe(false);
      });
    });

    describe('can_delete_photo coercion', function() {
      it('keeps can_delete_photo true when present', function() {
        spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
        spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({ can_delete_photo: true });

        const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, true);

        expect(result.can_delete_photo).toBe(true);
      });

      it('defaults can_delete_photo to false when missing', function() {
        spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
        spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({});

        const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, true);

        expect(result.can_delete_photo).toBe(false);
      });

      it('coerces a falsy-but-defined can_delete_photo to false', function() {
        spyOn(AccessStore, 'getCharacterAccess').and.returnValue({ is_player: false, is_staff: false });
        spyOn(AccessStore, 'getCharacterPermissions').and.returnValue({ can_delete_photo: 0 });

        const result = CharacterAccessResolver.merge('pcs', { id: 2 }, params, true);

        expect(result.can_delete_photo).toBe(false);
      });
    });
  });
});
