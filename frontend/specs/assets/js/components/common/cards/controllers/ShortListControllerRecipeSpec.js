import ShortListController
  from '../../../../../../../assets/js/components/common/cards/controllers/ShortListController.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('ShortListController (commonItemRecipe, issue #1449)', function() {
  it("fetches the entry's own request resource and quantity type", async function() {
    const ensureSpy = spyOn(RequestStore, 'ensure').and.returnValue(
      Promise.resolve({ data: [{ id: 2, name: 'Brew' }], pagination: { total: 1 } }),
    );
    const setItems = jasmine.createSpy('setItems');

    const cleanup = new ShortListController(
      'commonItemRecipe', setItems, jasmine.createSpy('setLoading'), jasmine.createSpy('setTotal'),
    ).buildEffect({ game_slug: 'demo', id: 4 }, 5)();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(ensureSpy).toHaveBeenCalledWith({
      componentName: 'ShortListController',
      resource: 'recipe',
      quantityType: 'commonItemCollection',
      params: { gameSlug: 'demo', commonItemId: 4 },
      query: { per_page: 5 },
    });
    expect(setItems).toHaveBeenCalledWith([{ id: 2, name: 'Brew' }]);

    cleanup();
  });
});
