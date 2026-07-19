import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import MyGameListItem from '../../../../../../../assets/js/components/common/list_types/MyGameListItem.js';
import MyGamesInfoBarRules from '../../../../../../../assets/js/components/common/list_types/helpers/MyGamesInfoBarRules.js';

describe('listTypeConfig', function() {
  describe('my-games', function() {
    const myGames = listTypeConfig['my-games'];

    it('uses MyGameListItem as the wrapper class', function() {
      expect(myGames.wrapperClass).toBe(MyGameListItem);
    });

    it('has no filters component', function() {
      expect(myGames.filtersComponent).toBeNull();
    });

    it('uses the plain photo type', function() {
      expect(myGames.photoType).toBe('photo');
    });

    it('shows the caption text under the photo', function() {
      expect(myGames.showCaption).toBe(true);
    });

    it('renders 4 items per row', function() {
      expect(myGames.itemsPerRow).toBe(4);
    });

    describe('.buildItemHref', function() {
      it('links to the game detail page using the nested game slug', function() {
        const item = new MyGameListItem({
          game: { name: 'Test Game', game_slug: 'test-game' },
          role: 'dm',
          character: null,
          conversations: { count: 0, unread_count: 0 },
        });

        expect(myGames.buildItemHref(item)).toBe('#/games/test-game');
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new MyGameListItem({
          game: { name: 'Test Game', game_slug: 'test-game' },
          role: 'dm',
          character: null,
          conversations: { count: 0, unread_count: 0 },
        });

        expect(myGames.buildActionBarProps(item, {})).toEqual({ canEdit: false, secondaryButtons: [] });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('delegates to MyGamesInfoBarRules with the raw entry', function() {
        const item = new MyGameListItem({
          game: { name: 'Test Game', game_slug: 'test-game' },
          role: 'player',
          character: { name: 'Aragorn' },
          conversations: { count: 2, unread_count: 1 },
        });

        expect(myGames.buildInfoBarItems(item)).toEqual(MyGamesInfoBarRules.build(item.data));
      });

      it('omits the character badge for a DM', function() {
        const item = new MyGameListItem({
          game: { name: 'Test Game', game_slug: 'test-game' },
          role: 'dm',
          character: null,
          conversations: { count: 2, unread_count: 1 },
        });

        const items = myGames.buildInfoBarItems(item);

        expect(items.some((entry) => entry.key === 'character')).toBe(false);
      });
    });

    describe('.fetchList', function() {
      it('fetches the my-games index with no permission check', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);
        const entry = {
          game: { name: 'Test Game', game_slug: 'test-game', cover_photo_path: null },
          role: 'dm',
          character: null,
          conversations: { count: 0, unread_count: 0 },
        };

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [entry],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await myGames.fetchList(undefined, undefined, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/my-games.json');
        expect(result.data).toEqual([entry]);
        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await myGames.fetchList(undefined, undefined, client);

        expect(result.data).toEqual([]);
      });
    });
  });
});
