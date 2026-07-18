import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import GameItemListItem from '../../../../../../../assets/js/components/common/list_types/GameItemListItem.js';
import HashRouteResolver from '../../../../../../../assets/js/utils/routing/HashRouteResolver.js';
import AccessStore from '../../../../../../../assets/js/utils/access/store/AccessStore.js';
import Translator from '../../../../../../../assets/js/i18n/Translator.js';

describe('listTypeConfig', function() {
  describe('items', function() {
    const { items } = listTypeConfig;

    it('uses GameItemListItem as the wrapper class', function() {
      expect(items.wrapperClass).toBe(GameItemListItem);
    });

    it('has no filters component', function() {
      expect(items.filtersComponent).toBeNull();
    });

    it('uses the item photo type', function() {
      expect(items.photoType).toBe('item');
    });

    it('shows the caption text under the photo', function() {
      expect(items.showCaption).toBe(true);
    });

    it('renders 6 items per row (the default)', function() {
      expect(items.itemsPerRow).toBe(6);
    });

    describe('.buildItemHref', function() {
      it('returns null, since items have no standalone detail page', function() {
        const item = new GameItemListItem({ id: 5, name: 'Cloak of Elvenkind' });

        expect(items.buildItemHref(item)).toBeNull();
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new GameItemListItem({ id: 5, name: 'Cloak of Elvenkind' });

        expect(items.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true })).toEqual({
          canEdit: false, secondaryButtons: [],
        });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('renders a hidden badge using the game items hidden label when hidden', function() {
        const item = new GameItemListItem({ id: 5, name: 'Cloak of Elvenkind', hidden: true });

        const infoBarItems = items.buildInfoBarItems(item);

        expect(infoBarItems.length).toBe(1);
        expect(infoBarItems[0].label.props.items).toEqual([{
          icon: 'bi-eye-slash-fill',
          text: Translator.t('game_items_page.hidden_label'),
          variant: null,
        }]);
      });

      it('returns an empty array when not hidden', function() {
        const item = new GameItemListItem({ id: 5, name: 'Cloak of Elvenkind' });

        expect(items.buildInfoBarItems(item)).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      it('fetches the player-facing endpoint when the requester cannot edit', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = new HashRouteResolver(() => '#/games/demo/items');

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [{ id: 5, name: 'Cloak of Elvenkind' }],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

        const result = await items.fetchList('demo', hashResolver, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/items.json');
        expect(result.data).toEqual([{ id: 5, name: 'Cloak of Elvenkind' }]);
        expect(result.canEdit).toBe(false);
      });

      it('fetches the admin endpoint when the requester can edit', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = new HashRouteResolver(() => '#/games/demo/items');

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

        const result = await items.fetchList('demo', hashResolver, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/items/all.json');
        expect(result.canEdit).toBe(true);
      });

      it('defaults to the player-facing endpoint when the permission check fails', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = new HashRouteResolver(() => '#/games/demo/items');

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [], pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.reject(new Error('nope')));

        const result = await items.fetchList('demo', hashResolver, client);

        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const hashResolver = new HashRouteResolver(() => '#/games/demo/items');

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));
        spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: false }));

        const result = await items.fetchList('demo', hashResolver, client);

        expect(result.data).toEqual([]);
      });
    });
  });
});
