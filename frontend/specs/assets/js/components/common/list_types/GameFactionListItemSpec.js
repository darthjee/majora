import GameFactionListItem from '../../../../../../assets/js/components/common/list_types/GameFactionListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';

describe('GameFactionListItem', function() {
  it('extends BaseListItem', function() {
    const item = new GameFactionListItem({ id: 1, name: 'The Silver Hand' });

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits photoUrl/displayText from BaseListItem', function() {
    const item = new GameFactionListItem({
      id: 1, name: 'The Silver Hand', photo_path: '/photos/1.png',
    });

    expect(item.photoUrl).toBe('/photos/1.png');
    expect(item.displayText).toBe('The Silver Hand');
  });

  it('defaults photoUrl to null when no photo is present', function() {
    const item = new GameFactionListItem({ id: 1, name: 'The Silver Hand' });

    expect(item.photoUrl).toBeNull();
  });
});
