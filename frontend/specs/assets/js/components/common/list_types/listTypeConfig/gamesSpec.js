import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import GameListItem from '../../../../../../../assets/js/components/common/list_types/GameListItem.js';

describe('listTypeConfig', function() {
  describe('games', function() {
    const { games } = listTypeConfig;

    it('uses GameListItem as the wrapper class', function() {
      expect(games.wrapperClass).toBe(GameListItem);
    });

    it('has no filters component', function() {
      expect(games.filtersComponent).toBeNull();
    });

    it('uses the plain photo type', function() {
      expect(games.photoType).toBe('photo');
    });

    it('shows the caption text under the photo', function() {
      expect(games.showCaption).toBe(true);
    });

    it('renders 4 items per row', function() {
      expect(games.itemsPerRow).toBe(4);
    });

    describe('.buildItemHref', function() {
      it('links to the game detail page', function() {
        const item = new GameListItem({ name: 'Test Game', game_slug: 'test-game' });

        expect(games.buildItemHref(item)).toBe('#/games/test-game');
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new GameListItem({ name: 'Test Game', game_slug: 'test-game' });

        expect(games.buildActionBarProps(item, {})).toEqual({ canEdit: false, secondaryButtons: [] });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('is always empty', function() {
        const item = new GameListItem({ name: 'Test Game', game_slug: 'test-game' });

        expect(games.buildInfoBarItems(item)).toEqual([]);
      });
    });

    describe('.fetchList', function() {
      it('fetches the games index with no permission check', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [{ name: 'Test Game', game_slug: 'test-game' }],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await games.fetchList(undefined, undefined, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/games.json');
        expect(result.data).toEqual([{ name: 'Test Game', game_slug: 'test-game' }]);
        expect(result.pagination).toEqual({ page: 1, pages: 1, perPage: 10 });
        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await games.fetchList(undefined, undefined, client);

        expect(result.data).toEqual([]);
      });
    });
  });
});
