import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import GameCommonItemListItem from '../../../../../../../assets/js/components/common/list_types/GameCommonItemListItem.js';
import HashRouteResolver from '../../../../../../../assets/js/utils/routing/HashRouteResolver.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';

describe('listTypeConfig', function() {
  describe('commonItems', function() {
    const { commonItems } = listTypeConfig;

    it('uses GameCommonItemListItem as the wrapper class', function() {
      expect(commonItems.wrapperClass).toBe(GameCommonItemListItem);
    });

    it('has no filters component', function() {
      expect(commonItems.filtersComponent).toBeNull();
    });

    it('uses the commonItem photo type', function() {
      expect(commonItems.photoType).toBe('commonItem');
    });

    it('shows the caption text under the photo', function() {
      expect(commonItems.showCaption).toBe(true);
    });

    it('renders 6 items per row (the default)', function() {
      expect(commonItems.itemsPerRow).toBe(6);
    });

    describe('.buildItemHref', function() {
      it('links to the common item detail page (issue #826)', function() {
        const item = new GameCommonItemListItem({ id: 5, name: 'Healing Potion' });

        expect(commonItems.buildItemHref(item, { gameSlug: 'demo' })).toBe('#/games/demo/common_items/5');
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new GameCommonItemListItem({ id: 5, name: 'Healing Potion' });

        expect(commonItems.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true })).toEqual({
          canEdit: false, secondaryButtons: [],
        });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('renders a hidden badge using the game common items hidden label when hidden', function() {
        const item = new GameCommonItemListItem({ id: 5, name: 'Healing Potion', hidden: true });

        const infoBarItems = commonItems.buildInfoBarItems(item);

        expect(infoBarItems.length).toBe(1);
        expect(infoBarItems[0].label.props.items).toEqual([{
          icon: 'bi-eye-slash-fill',
          text: Translator.t('game_common_items_page.hidden_label'),
          variant: null,
        }]);
      });

      it('returns an empty array when not hidden', function() {
        const item = new GameCommonItemListItem({ id: 5, name: 'Healing Potion' });

        expect(commonItems.buildInfoBarItems(item)).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      afterEach(function() {
        RequestStore.reset();
      });

      it('fetches through RequestStore with the common item collection and resolves canEdit false', async function() {
        const hashResolver = new HashRouteResolver(() => '#/games/demo/common_items');

        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [{ id: 5, name: 'Healing Potion' }],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

        const result = await commonItems.fetchList('demo', hashResolver);

        expect(RequestStore.ensure).toHaveBeenCalledWith({
          componentName: 'ListPageController',
          resource: 'commonItem',
          quantityType: 'collection',
          params: { gameSlug: 'demo' },
          query: {},
        });
        expect(result.data).toEqual([{ id: 5, name: 'Healing Potion' }]);
        expect(result.canEdit).toBe(false);
      });

      it('resolves canEdit true when the requester can edit the game', async function() {
        const hashResolver = new HashRouteResolver(() => '#/games/demo/common_items');

        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

        const result = await commonItems.fetchList('demo', hashResolver);

        expect(result.canEdit).toBe(true);
      });

      it('defaults to canEdit false when the permission check fails', async function() {
        const hashResolver = new HashRouteResolver(() => '#/games/demo/common_items');

        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

        const result = await commonItems.fetchList('demo', hashResolver);

        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        const hashResolver = new HashRouteResolver(() => '#/games/demo/common_items');

        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

        const result = await commonItems.fetchList('demo', hashResolver);

        expect(result.data).toEqual([]);
      });
    });
  });
});
