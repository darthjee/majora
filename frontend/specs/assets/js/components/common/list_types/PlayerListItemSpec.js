import PlayerListItem from '../../../../../../assets/js/components/common/list_types/PlayerListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';

describe('PlayerListItem', function() {
  it('extends BaseListItem', function() {
    const item = new PlayerListItem({ id: 1, user: null, character: null });

    expect(item instanceof BaseListItem).toBe(true);
  });

  describe('#photoUrl', function() {
    it('uses the character photo_url field', function() {
      const item = new PlayerListItem({
        id: 1, user: null, character: { name: 'Aragorn', photo_url: '/photos/1.png' },
      });

      expect(item.photoUrl).toBe('/photos/1.png');
    });

    it('is null when the player has no character', function() {
      const item = new PlayerListItem({ id: 1, user: null, character: null });

      expect(item.photoUrl).toBeNull();
    });
  });

  describe('#displayText', function() {
    it('uses the character name field', function() {
      const item = new PlayerListItem({
        id: 1, user: null, character: { name: 'Aragorn', photo_url: '/photos/1.png' },
      });

      expect(item.displayText).toBe('Aragorn');
    });

    it('is an empty string when the player has no character', function() {
      const item = new PlayerListItem({ id: 1, user: null, character: null });

      expect(item.displayText).toBe('');
    });
  });
});
