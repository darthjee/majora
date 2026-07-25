import OpenPollsWidgetController
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/controllers/OpenPollsWidgetController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('OpenPollsWidgetController', function() {
  let setCount;
  let setLoading;
  let ensureSpy;

  beforeEach(function() {
    setCount = jasmine.createSpy('setCount');
    setLoading = jasmine.createSpy('setLoading');
    ensureSpy = spyOn(RequestStore, 'ensure');
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#buildEffect', function() {
    it('fetches the open polls count from the resolved pagination total', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [],
        pagination: {
          page: 1, pages: 3, perPage: 1, total: 3,
        },
      }));

      const cleanup = new OpenPollsWidgetController(setCount, setLoading).buildEffect('demo')();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(ensureSpy).toHaveBeenCalledWith({
        componentName: 'OpenPollsWidgetController',
        resource: 'poll',
        quantityType: 'collection',
        params: { gameSlug: 'demo' },
        query: { per_page: '1', status: 'open' },
      });
      expect(setCount).toHaveBeenCalledWith(3);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('defaults the count to 0 when there are no open polls', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [],
        pagination: {
          page: 1, pages: 1, perPage: 1, total: 0,
        },
      }));

      const cleanup = new OpenPollsWidgetController(setCount, setLoading).buildEffect('demo')();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCount).toHaveBeenCalledWith(0);

      cleanup();
    });

    it('defaults the count to 0 when the fetch rejects', async function() {
      ensureSpy.and.returnValue(Promise.reject(new Error('network error')));

      const cleanup = new OpenPollsWidgetController(setCount, setLoading).buildEffect('demo')();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCount).toHaveBeenCalledWith(0);
      expect(setLoading).toHaveBeenCalledWith(false);

      cleanup();
    });

    it('does not update state after unmount', async function() {
      ensureSpy.and.returnValue(Promise.resolve({
        data: [],
        pagination: {
          page: 1, pages: 3, perPage: 1, total: 3,
        },
      }));

      const cleanup = new OpenPollsWidgetController(setCount, setLoading).buildEffect('demo')();
      cleanup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(setCount).not.toHaveBeenCalled();
      expect(setLoading).not.toHaveBeenCalled();
    });
  });
});
