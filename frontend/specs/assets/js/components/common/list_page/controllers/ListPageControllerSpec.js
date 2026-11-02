import ListPageController from '../../../../../../../assets/js/components/common/list_page/controllers/ListPageController.js';
import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import HttpResponseError from '../../../../../../../assets/js/utils/http/HttpResponseError.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';

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

    expect(setError).toHaveBeenCalledWith('Unable to load list.');
    expect(setLoading).toHaveBeenCalledWith(false);

    cleanup();
  });

  describe('when the list type has a resolveErrorMessage hook', function() {
    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    function runGames(error) {
      const setError = jasmine.createSpy('setError');

      spyOn(listTypeConfig.games, 'fetchList').and.returnValue(Promise.reject(error));

      const controller = new ListPageController(
        'games', undefined, Noop.noop, Noop.noop, Noop.noop, setError,
      );
      const cleanup = controller.buildEffect()();

      return { setError, cleanup };
    }

    it('shows the translated warning for a domain_not_recognized 404', async function() {
      const error = new HttpResponseError('request failed', 404, {
        errors: { detail: ['domain_not_recognized'] },
      });
      const { setError, cleanup } = runGames(error);
      await flush();

      expect(setError).toHaveBeenCalledWith({
        message: Translator.t('games_page.domain_not_recognized'),
        variant: 'warning',
      });

      cleanup();
    });

    it('falls back to the generic message for other failures', async function() {
      const { setError, cleanup } = runGames(new HttpResponseError('request failed', 500, null));
      await flush();

      expect(setError).toHaveBeenCalledWith('Unable to load list.');

      cleanup();
    });
  });

  it('uses the generic message for list types without the hook', function() {
    const controller = new ListPageController(
      'treasures', 'demo', Noop.noop, Noop.noop, Noop.noop, Noop.noop,
    );

    expect(listTypeConfig.treasures.resolveErrorMessage).toBeUndefined();
    expect(controller.resolveError(new HttpResponseError('x', 404, {
      errors: { detail: ['domain_not_recognized'] },
    }))).toBe('Unable to load list.');
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
