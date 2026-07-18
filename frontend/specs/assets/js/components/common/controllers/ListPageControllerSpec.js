import ListPageController from '../../../../../../assets/js/components/common/controllers/ListPageController.js';
import listTypeConfig from '../../../../../../assets/js/components/common/listTypes/listTypeConfig.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('ListPageController', function() {
  let fetchListSpy;

  beforeEach(function() {
    fetchListSpy = spyOn(listTypeConfig.treasures, 'fetchList');
  });

  it('delegates fetching to the type config, forwarding gameSlug/hashResolver/client', async function() {
    const setItems = jasmine.createSpy('setItems');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');
    const setCanEdit = jasmine.createSpy('setCanEdit');

    fetchListSpy.and.returnValue(Promise.resolve({
      data: [{ id: 1, name: 'Sword' }],
      pagination: { page: 1, pages: 1, perPage: 10 },
      canEdit: true,
    }));

    const controller = new ListPageController(
      'treasures', 'demo', setItems, setPagination, setLoading, setError, setCanEdit,
    );
    const cleanup = controller.buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchListSpy).toHaveBeenCalledWith('demo', controller.hashResolver, controller.client);
    expect(setItems).toHaveBeenCalledWith([{ id: 1, name: 'Sword' }]);
    expect(setPagination).toHaveBeenCalledWith({ page: 1, pages: 1, perPage: 10 });
    expect(setCanEdit).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setError).not.toHaveBeenCalled();

    cleanup();
  });

  it('sets an error when the fetch fails', async function() {
    const setItems = jasmine.createSpy('setItems');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    fetchListSpy.and.returnValue(Promise.reject(new Error('boom')));

    const controller = new ListPageController('treasures', 'demo', setItems, setPagination, setLoading, setError);
    const cleanup = controller.buildEffect()();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setError).toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  it('does not update state after the effect is cleaned up (unmounted)', async function() {
    const setItems = jasmine.createSpy('setItems');
    const setPagination = jasmine.createSpy('setPagination');
    const setLoading = jasmine.createSpy('setLoading');
    const setError = jasmine.createSpy('setError');

    fetchListSpy.and.returnValue(Promise.resolve({
      data: [], pagination: { page: 1, pages: 1, perPage: 10 }, canEdit: false,
    }));

    const controller = new ListPageController('treasures', 'demo', setItems, setPagination, setLoading, setError);
    const cleanup = controller.buildEffect()();

    cleanup();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(setItems).not.toHaveBeenCalled();
  });

  it('defaults setCanEdit to a no-op', function() {
    expect(() => new ListPageController(
      'treasures', 'demo', Noop.noop, Noop.noop, Noop.noop, Noop.noop,
    )).not.toThrow();
  });
});
