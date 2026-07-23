import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import TreasureListItem from '../../../../../../../assets/js/components/common/list_types/TreasureListItem.js';
import TreasureFilters from '../../../../../../../assets/js/components/resources/treasure/pages/elements/TreasureFilters.jsx';
import TreasureCardHelper from '../../../../../../../assets/js/components/common/cards/helpers/TreasureCardHelper.jsx';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';

function fakeHashResolver(filterParams = new URLSearchParams()) {
  return { getFilterParams: () => filterParams, getPaginationParams: () => new URLSearchParams() };
}

describe('listTypeConfig', function() {
  describe('treasures', function() {
    const { treasures } = listTypeConfig;

    it('uses TreasureListItem as the wrapper class', function() {
      expect(treasures.wrapperClass).toBe(TreasureListItem);
    });

    it('uses TreasureFilters as the filters component', function() {
      expect(treasures.filtersComponent).toBe(TreasureFilters);
    });

    it('uses the treasure photo type', function() {
      expect(treasures.photoType).toBe('treasure');
    });

    it('shows the caption text under the photo', function() {
      expect(treasures.showCaption).toBe(true);
    });

    it('renders 6 items per row (the default)', function() {
      expect(treasures.itemsPerRow).toBe(6);
    });

    describe('.buildItemHref', function() {
      it('links to the global treasure detail page', function() {
        const item = new TreasureListItem({ id: 42, name: 'Golden Crown', value: 500 });

        expect(treasures.buildItemHref(item)).toBe('#/treasures/42');
      });
    });

    describe('.buildInfoBarItems', function() {
      it('delegates to TreasureCardHelper.buildInfoBarItems', function() {
        const item = new TreasureListItem({
          id: 1, name: 'Golden Crown', value: 500, hidden: true,
        });

        expect(treasures.buildInfoBarItems(item)).toEqual(TreasureCardHelper.buildInfoBarItems(item.data));
      });
    });

    describe('.buildActionBarProps', function() {
      let originalWindow;

      beforeEach(function() {
        originalWindow = globalThis.window;
        globalThis.window = { location: { hash: '' } };
      });

      afterEach(function() {
        globalThis.window = originalWindow;
      });

      it('gates canEdit on canEdit and the treasure being exclusive to the current game', function() {
        const item = new TreasureListItem({
          id: 1, name: 'Golden Crown', value: 500, game_slug: 'demo',
        });
        const props = treasures.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true });

        expect(props.canEdit).toBe(true);
      });

      it('does not grant manage access for treasures from another game', function() {
        const item = new TreasureListItem({
          id: 1, name: 'Golden Crown', value: 500, game_slug: 'other',
        });
        const props = treasures.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true });

        expect(props.canEdit).toBe(false);
      });

      it('invokes the context onUploadClick with the raw treasure on upload click', function() {
        const item = new TreasureListItem({
          id: 1, name: 'Golden Crown', value: 500, game_slug: 'demo',
        });
        const onUploadClick = jasmine.createSpy('onUploadClick');
        const props = treasures.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true, onUploadClick });

        props.onClick();

        expect(onUploadClick).toHaveBeenCalledWith(item.data);
      });

      it('does not include a secondary edit button when the user cannot manage the treasure', function() {
        const item = new TreasureListItem({
          id: 1, name: 'Golden Crown', value: 500, game_slug: 'demo',
        });
        const props = treasures.buildActionBarProps(item, { gameSlug: 'demo', canEdit: false });

        expect(props.secondaryButtons).toEqual([]);
      });

      it('navigates to the game-scoped edit page when the secondary edit button is clicked', function() {
        const item = new TreasureListItem({
          id: 1, name: 'Golden Crown', value: 500, game_slug: 'demo',
        });
        const props = treasures.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true });

        expect(props.secondaryButtons.length).toBe(1);
        props.secondaryButtons[0].onClick();

        expect(window.location.hash).toBe('#/games/demo/treasures/1/edit');
      });
    });

    describe('.fetchList', function() {
      afterEach(function() {
        RequestStore.reset();
      });

      it('fetches through RequestStore with the game-owned treasure collection and resolves canEdit false',
        async function() {
          spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
            data: [{ id: 1, name: 'Sword', value: 100 }],
            pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

          const result = await treasures.fetchList('demo', fakeHashResolver());

          expect(RequestStore.ensure).toHaveBeenCalledWith({
            componentName: 'ListPageController',
            resource: 'treasure',
            quantityType: 'collection',
            params: { gameSlug: 'demo', kind: 'game' },
            query: {},
          });
          expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
          expect(result.data).toEqual([{ id: 1, name: 'Sword', value: 100 }]);
          expect(result.pagination).toEqual({ page: 1, pages: 1, perPage: 10 });
          expect(result.canEdit).toBe(false);
        });

      it('resolves canEdit true when the requester can edit the game', async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

        const result = await treasures.fetchList('demo', fakeHashResolver());

        expect(result.canEdit).toBe(true);
      });

      it('passes the filter params from the hash resolver as part of the query', async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));
        const hashResolver = fakeHashResolver(
          new URLSearchParams({ min_value: '10', max_value: '100', name: 'sword' }),
        );

        await treasures.fetchList('demo', hashResolver);

        expect(RequestStore.ensure).toHaveBeenCalledWith({
          componentName: 'ListPageController',
          resource: 'treasure',
          quantityType: 'collection',
          params: { gameSlug: 'demo', kind: 'game' },
          query: { min_value: '10', max_value: '100', name: 'sword' },
        });
      });

      it('defaults to canEdit false when the permission check fails', async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

        const result = await treasures.fetchList('demo', fakeHashResolver());

        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

        const result = await treasures.fetchList('demo', fakeHashResolver());

        expect(result.data).toEqual([]);
      });
    });
  });
});
