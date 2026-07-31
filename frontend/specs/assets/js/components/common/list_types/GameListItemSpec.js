import GameListItem from '../../../../../../assets/js/components/common/list_types/GameListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';

describe('GameListItem', function() {
  it('extends BaseListItem', function() {
    const item = new GameListItem({ name: 'Test Game', game_slug: 'test-game' });

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits displayText from BaseListItem', function() {
    const item = new GameListItem({ name: 'Test Game', game_slug: 'test-game' });

    expect(item.displayText).toBe('Test Game');
  });

  describe('#photoUrl', function() {
    it('inherits the photo_path field from BaseListItem', function() {
      const item = new GameListItem({
        name: 'Test Game', game_slug: 'test-game', photo_path: '/photos/1.png',
      });

      expect(item.photoUrl).toBe('/photos/1.png');
    });

    it('is null when photo_path is absent', function() {
      const item = new GameListItem({ name: 'Test Game', game_slug: 'test-game' });

      expect(item.photoUrl).toBeNull();
    });
  });
});
