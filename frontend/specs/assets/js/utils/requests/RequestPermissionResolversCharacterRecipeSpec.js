import RequestPermissionResolvers from '../../../../../assets/js/utils/requests/RequestPermissionResolvers.js';
import AccessStore from '../../../../../assets/js/utils/access/store/AccessStore.js';

describe('RequestPermissionResolvers (characterRecipe, issue #1450)', function() {
  describe('.resolve', function() {
    ['collection', 'single'].forEach((quantityType) => {
      it(`resolves character-level permissions for ${quantityType}`, function() {
        spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));
        spyOn(AccessStore, 'ensureGamePermissions');

        RequestPermissionResolvers.resolve('characterRecipe', quantityType, {
          gameSlug: 'demo', kind: 'pcs', id: '3', characterRecipeId: '7',
        });

        expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('pcs', 'demo', '3');
        expect(AccessStore.ensureGamePermissions).not.toHaveBeenCalled();
      });
    });

    it('resolves game-level permissions for availableCollection', function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      spyOn(AccessStore, 'ensureCharacterPermissions');

      RequestPermissionResolvers.resolve('characterRecipe', 'availableCollection', {
        gameSlug: 'demo', kind: 'pcs', id: '3',
      });

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
      expect(AccessStore.ensureCharacterPermissions).not.toHaveBeenCalled();
    });
  });
});
