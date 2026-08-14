import CharacterFactionListItem
  from '../../../../../../assets/js/components/common/list_types/CharacterFactionListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';

describe('CharacterFactionListItem', function() {
  it('extends BaseListItem', function() {
    const item = new CharacterFactionListItem({ id: 1, game_faction_id: 5, name: 'The Silver Hand' });

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits photoUrl/displayText from BaseListItem', function() {
    const item = new CharacterFactionListItem({
      id: 1, game_faction_id: 5, name: 'The Silver Hand', photo_path: '/photos/1.png',
    });

    expect(item.photoUrl).toBe('/photos/1.png');
    expect(item.displayText).toBe('The Silver Hand');
  });

  describe('#hidden', function() {
    it('is true when the raw entry is hidden', function() {
      const item = new CharacterFactionListItem({
        id: 1, game_faction_id: 5, name: 'The Silver Hand', hidden: true,
      });

      expect(item.hidden).toBe(true);
    });

    it('is false when the raw entry is not hidden', function() {
      const item = new CharacterFactionListItem({ id: 1, game_faction_id: 5, name: 'The Silver Hand' });

      expect(item.hidden).toBe(false);
    });
  });
});
