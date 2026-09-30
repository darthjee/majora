import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig (characterRecipe, issue #1450)', function() {
  const params = {
    gameSlug: 'demo', kind: 'pcs', id: '3', characterRecipeId: '7',
  };
  const npcParams = { ...params, kind: 'npcs' };

  it('resolves GET.collection regular/private paths and permissions', function() {
    const collection = resourceConfig.get('GET', 'characterRecipe', 'collection');

    expect(collection.regular.path(params)).toBe('/games/demo/pcs/3/recipes.json');
    expect(collection.regular.permission).toBeNull();
    expect(collection.private.path(npcParams)).toBe('/games/demo/npcs/3/recipes/all.json');
    expect(collection.private.permission).toBe('can_edit');
    expect(collection.private.skipCache).toBeTrue();
  });

  it('resolves GET.single regular/private paths and permissions', function() {
    const single = resourceConfig.get('GET', 'characterRecipe', 'single');

    expect(single.regular.path(params)).toBe('/games/demo/pcs/3/recipes/7.json');
    expect(single.regular.permission).toBeNull();
    expect(single.private.path(params)).toBe('/games/demo/pcs/3/recipes/7/full.json');
    expect(single.private.permission).toBe('can_edit');
    expect(single.private.skipCache).toBeTrue();
  });

  it('resolves GET.availableCollection regular/private paths and permissions', function() {
    const available = resourceConfig.get('GET', 'characterRecipe', 'availableCollection');

    expect(available.regular.path(params)).toBe('/games/demo/pcs/3/recipes/available.json');
    expect(available.regular.permission).toBeNull();
    expect(available.regular.skipCache).toBeTrue();
    expect(available.private.path(params)).toBe('/games/demo/pcs/3/recipes/available/all.json');
    expect(available.private.permission).toBe('can_edit');
    expect(available.private.skipCache).toBeTrue();
  });

  it('resolves POST.acquire regular/private paths', function() {
    const acquire = resourceConfig.get('POST', 'characterRecipe', 'acquire');

    expect(acquire.regular.path(params)).toBe('/games/demo/pcs/3/recipes/acquire.json');
    expect(acquire.private.path(npcParams)).toBe('/games/demo/npcs/3/recipes/acquire/all.json');
  });

  it('resolves POST.remove regular/private paths', function() {
    const remove = resourceConfig.get('POST', 'characterRecipe', 'remove');

    expect(remove.regular.path(params)).toBe('/games/demo/pcs/3/recipes/remove.json');
    expect(remove.private.path(npcParams)).toBe('/games/demo/npcs/3/recipes/remove/all.json');
  });

  it('resolves PATCH.single, unbranched', function() {
    const single = resourceConfig.get('PATCH', 'characterRecipe', 'single');

    expect(single.regular.path(params)).toBe('/games/demo/pcs/3/recipes/7.json');
    expect(single.private).toBe(single.regular);
  });
});
