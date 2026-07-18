import listTypeConfig from '../../../../../../../assets/js/components/common/list_types/listTypeConfig.js';
import PlayerListItem from '../../../../../../../assets/js/components/common/list_types/PlayerListItem.js';
import UserAvatarBadge from '../../../../../../../assets/js/components/common/badges/UserAvatarBadge.jsx';

describe('listTypeConfig', function() {
  describe('players', function() {
    const { players } = listTypeConfig;

    it('uses PlayerListItem as the wrapper class', function() {
      expect(players.wrapperClass).toBe(PlayerListItem);
    });

    it('has no filters component', function() {
      expect(players.filtersComponent).toBeNull();
    });

    it('uses the avatar photo type', function() {
      expect(players.photoType).toBe('avatar');
    });

    it('shows the caption text under the photo', function() {
      expect(players.showCaption).toBe(true);
    });

    describe('.buildItemHref', function() {
      it('is always null (no standalone detail page)', function() {
        const item = new PlayerListItem({ id: 1, user: null, character: null });

        expect(players.buildItemHref(item)).toBeNull();
      });
    });

    describe('.buildActionBarProps', function() {
      it('is always non-manageable', function() {
        const item = new PlayerListItem({ id: 1, user: null, character: null });

        expect(players.buildActionBarProps(item, { gameSlug: 'demo', canEdit: true })).toEqual({
          canEdit: false, secondaryButtons: [],
        });
      });
    });

    describe('.buildInfoBarItems', function() {
      it('returns an empty array when the player has no linked user', function() {
        const item = new PlayerListItem({ id: 1, user: null, character: null });

        expect(players.buildInfoBarItems(item)).toEqual([]);
      });

      it('returns a single user-avatar badge item when the player has a linked user', function() {
        const item = new PlayerListItem({
          id: 1,
          user: { display_name: 'Frodo', photo_url: '/avatars/1.png' },
          character: null,
        });

        const items = players.buildInfoBarItems(item);

        expect(items.length).toBe(1);
        expect(items[0].key).toBe('user-badge');
        expect(items[0].label.type).toBe(UserAvatarBadge);
        expect(items[0].label.props.photoUrl).toBe('/avatars/1.png');
        expect(items[0].label.props.displayName).toBe('Frodo');
      });
    });

    describe('.fetchList', function() {
      it('fetches the game players endpoint with no permission check', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: [{ id: 1, user: null, character: null }],
          pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await players.fetchList('demo', undefined, client);

        expect(client.fetchIndex).toHaveBeenCalledWith('/games/demo/players.json');
        expect(result.data).toEqual([{ id: 1, user: null, character: null }]);
        expect(result.canEdit).toBe(false);
      });

      it('defaults to an empty array when the response data is not an array', async function() {
        const client = jasmine.createSpyObj('client', ['fetchIndex']);

        client.fetchIndex.and.returnValue(Promise.resolve({
          data: null, pagination: { page: 1, pages: 1, perPage: 10 },
        }));

        const result = await players.fetchList('demo', undefined, client);

        expect(result.data).toEqual([]);
      });
    });
  });
});
