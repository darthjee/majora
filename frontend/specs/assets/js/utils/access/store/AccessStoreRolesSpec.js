import AccessStoreRoles from '../../../../../../assets/js/utils/access/store/AccessStoreRoles.js';

describe('AccessStoreRoles', function() {
  describe('#fromAccess', function() {
    it('returns an empty array for an all-false/null access payload', function() {
      const access = {
        is_superuser: null, is_staff: null, is_dm: null, is_player: false, is_owner: false, is_logged: false,
      };

      expect(AccessStoreRoles.fromAccess(access)).toEqual([]);
    });

    it('includes only the truthy flags, treating null the same as false', function() {
      const access = {
        is_superuser: null, is_staff: null, is_dm: true, is_player: false, is_owner: true, is_logged: true,
      };

      expect(AccessStoreRoles.fromAccess(access)).toEqual(['dm', 'owner', 'logged']);
    });

    it('includes every role name when every flag is truthy', function() {
      const access = {
        is_superuser: true, is_staff: true, is_dm: true, is_player: true, is_owner: true, is_logged: true,
      };

      expect(AccessStoreRoles.fromAccess(access)).toEqual([
        'superuser', 'staff', 'dm', 'player', 'owner', 'logged',
      ]);
    });

    it('returns an empty array for a nullish access payload', function() {
      expect(AccessStoreRoles.fromAccess(undefined)).toEqual([]);
      expect(AccessStoreRoles.fromAccess(null)).toEqual([]);
    });
  });
});
