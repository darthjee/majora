import RequestPermissionResolvers from '../../../../../assets/js/utils/requests/RequestPermissionResolvers.js';
import AccessStore from '../../../../../assets/js/utils/access/store/AccessStore.js';

describe('RequestPermissionResolvers (recipe, issue #1449)', function() {
  describe('.resolve', function() {
    [
      ['collection', { gameSlug: 'demo' }],
      ['single', { gameSlug: 'demo', id: '9' }],
      ['commonItemCollection', { gameSlug: 'demo', commonItemId: '4' }],
      ['characters', { gameSlug: 'demo', id: '9' }],
    ].forEach(([quantityType, params]) => {
      it(`resolves game-level permissions for the recipe ${quantityType}`, function() {
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
        spyOn(AccessStore, 'ensureRecipePermissions');

        RequestPermissionResolvers.resolve('recipe', quantityType, params);

        expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
        expect(AccessStore.ensureRecipePermissions).not.toHaveBeenCalled();
      });
    });
  });
});
