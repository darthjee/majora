import ShortListController
  from '../../../../../../../assets/js/components/common/cards/controllers/ShortListController.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('ShortListController', function() {
  let setItems;
  let setLoading;
  let setTotal;
  let ensureSpy;

  beforeEach(function() {
    setItems = jasmine.createSpy('setItems');
    setLoading = jasmine.createSpy('setLoading');
    setTotal = jasmine.createSpy('setTotal');
    ensureSpy = spyOn(RequestStore, 'ensure');
  });

  describe('#buildEffect', function() {
    it('fetches a game-scoped resource (pc) through RequestStore', async function() {
      const pcs = [{ id: 1, name: 'Aragorn' }];
      ensureSpy.and.returnValue(Promise.resolve({ data: pcs, pagination: { total: 12 } }));

      const cleanup = new ShortListController('pc', setItems, setLoading, setTotal)
        .buildEffect({ game_slug: 'demo' }, 5)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'ShortListController',
        resource: 'pc',
        quantityType: 'collection',
        params: { gameSlug: 'demo' },
        query: { per_page: 5 },
      });
      expect(setItems).toHaveBeenCalledWith(pcs);
      expect(setTotal).toHaveBeenCalledWith(12);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('fetches a character-scoped resource (treasure) using its configured buildParams', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: [], pagination: { total: 0 } }));

      const cleanup = new ShortListController('treasure', setItems, setLoading, setTotal)
        .buildEffect({ game_slug: 'demo', id: 7, is_pc: true }, 5)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'ShortListController',
        resource: 'treasure',
        quantityType: 'collection',
        params: { gameSlug: 'demo', kind: 'pcs', id: 7 },
        query: { per_page: 5 },
      });

      cleanup();
    });

    it('degrades to an empty list and a zero total when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new ShortListController('item', setItems, setLoading, setTotal)
        .buildEffect({ game_slug: 'demo', id: 7, is_pc: false }, 5)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setItems).toHaveBeenCalledWith([]);
      expect(setTotal).toHaveBeenCalledWith(0);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('degrades to an empty list when the resolved data is not an array', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: { unexpected: 'shape' }, pagination: { total: 0 } }));

      const cleanup = new ShortListController('npc', setItems, setLoading, setTotal)
        .buildEffect({ game_slug: 'demo' }, 5)();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setItems).toHaveBeenCalledWith([]);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      ensureSpy.and.returnValue(Promise.resolve({ data: [{ id: 1 }], pagination: { total: 1 } }));

      const cleanup = new ShortListController('pc', setItems, setLoading, setTotal)
        .buildEffect({ game_slug: 'demo' }, 5)();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setItems).not.toHaveBeenCalled();
      expect(setTotal).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
