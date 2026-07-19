import MyGameListItem from '../../../../../../assets/js/components/common/list_types/MyGameListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';

describe('MyGameListItem', function() {
  it('extends BaseListItem', function() {
    const item = new MyGameListItem({
      game: { name: 'Test Game', game_slug: 'test-game', cover_photo_path: null },
      role: 'player',
      character: null,
      conversations: { count: 0, unread_count: 0 },
    });

    expect(item instanceof BaseListItem).toBe(true);
  });

  describe('#photoUrl', function() {
    it('uses the nested game cover_photo_path field', function() {
      const item = new MyGameListItem({
        game: { name: 'Test Game', game_slug: 'test-game', cover_photo_path: '/photos/1.png' },
        role: 'dm',
        character: null,
        conversations: { count: 0, unread_count: 0 },
      });

      expect(item.photoUrl).toBe('/photos/1.png');
    });

    it('is null when the nested game has no cover_photo_path', function() {
      const item = new MyGameListItem({
        game: { name: 'Test Game', game_slug: 'test-game' },
        role: 'dm',
        character: null,
        conversations: { count: 0, unread_count: 0 },
      });

      expect(item.photoUrl).toBeNull();
    });
  });

  describe('#displayText', function() {
    it('uses the nested game name field', function() {
      const item = new MyGameListItem({
        game: { name: 'Test Game', game_slug: 'test-game', cover_photo_path: null },
        role: 'dm',
        character: null,
        conversations: { count: 0, unread_count: 0 },
      });

      expect(item.displayText).toBe('Test Game');
    });
  });
});
