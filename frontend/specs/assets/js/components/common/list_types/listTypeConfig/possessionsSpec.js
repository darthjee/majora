import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import GamePossessionListItem from '../../../../../../../assets/js/components/common/list_types/GamePossessionListItem.js';
import HashRouteResolver from '../../../../../../../assets/js/utils/routing/HashRouteResolver.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../../assets/js/utils/requests/RequestStore.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';

describe('listTypeConfig', function() {
  describe('possessions', function() {
    const { possessions } = listTypeConfig;

    it('uses GamePossessionListItem as the wrapper class', function() {
      expect(possessions.wrapperClass).toBe(GamePossessionListItem);
    });

    it('has no filters component', function() {
      expect(possessions.filtersComponent).toBeNull();
    });

    it('uses the possession photo type', function() {
      expect(possessions.photoType).toBe('possession');
    });

    it('shows the caption text under the photo', function() {
      expect(possessions.showCaption).toBe(true);
    });

    it('renders 6 items per row (the default)', function() {
      expect(possessions.itemsPerRow).toBe(6);
    });

    describe('.buildItemHref', function() {
      it('links to the possession detail page (issue #1074)', function() {
        const item = new GamePossessionListItem({ id: 5, name: 'Old Tavern' });

        expect(possessions.buildItemHref(item, { gameSlug: 'demo' })).toBe('#/games/demo/possessions/5');
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new GamePossessionListItem({ id: 5, name: 'Old Tavern' });

        expect(possessions.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true })).toEqual({
          canEdit: false, secondaryButtons: [],
        });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('renders a hidden badge using the game possessions hidden label when hidden', function() {
        const item = new GamePossessionListItem({ id: 5, name: 'Old Tavern', hidden: true });

        const infoBarItems = possessions.buildInfoBarItems(item);

        expect(infoBarItems.length).toBe(1);
        expect(infoBarItems[0].label.props.items).toEqual([{
          icon: 'bi-eye-slash-fill',
          text: Translator.t('game_possessions_page.hidden_label'),
          variant: null,
        }]);
      });

      it('returns an empty array when not hidden', function() {
        const item = new GamePossessionListItem({ id: 5, name: 'Old Tavern' });

        expect(possessions.buildInfoBarItems(item)).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      afterEach(function() {
        RequestStore.reset();
      });

      it('fetches through RequestStore with the game-owned possession collection and resolves canEdit false',
        async function() {
          const hashResolver = new HashRouteResolver(() => '#/games/demo/possessions');

          spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
            data: [{ id: 5, name: 'Old Tavern' }],
            pagination: { page: 1, pages: 1, perPage: 10 },
          }));
          spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

          const result = await possessions.fetchList('demo', hashResolver);

          expect(RequestStore.ensure).toHaveBeenCalledWith({
            componentName: 'ListPageController',
            resource: 'possession',
            quantityType: 'collection',
            params: { gameSlug: 'demo', kind: 'game' },
            query: {},
          });
          expect(result.data).toEqual([{ id: 5, name: 'Old Tavern' }]);
          expect(result.canEdit).toBe(false);
        });

      it('resolves canEdit true when the requester can edit the game', async function() {
        const hashResolver = new HashRouteResolver(() => '#/games/demo/possessions');

        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

        const result = await possessions.fetchList('demo', hashResolver);

        expect(result.canEdit).toBe(true);
      });

      it('defaults to canEdit false when the permission check fails', async function() {
        const hashResolver = new HashRouteResolver(() => '#/games/demo/possessions');

        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

        const result = await possessions.fetchList('demo', hashResolver);

        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        const hashResolver = new HashRouteResolver(() => '#/games/demo/possessions');

        spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

        const result = await possessions.fetchList('demo', hashResolver);

        expect(result.data).toEqual([]);
      });
    });
  });
});
