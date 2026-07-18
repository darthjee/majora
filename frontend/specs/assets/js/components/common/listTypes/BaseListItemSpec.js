import BaseListItem from '../../../../../../assets/js/components/common/listTypes/BaseListItem.js';

describe('BaseListItem', function() {
  it('stores the raw data', function() {
    const data = { id: 1, name: 'Golden Crown' };
    const item = new BaseListItem(data);

    expect(item.data).toBe(data);
  });

  describe('#photoUrl', function() {
    it('returns the raw entry photo_path', function() {
      const item = new BaseListItem({ id: 1, name: 'Golden Crown', photo_path: '/photos/1.png' });

      expect(item.photoUrl).toBe('/photos/1.png');
    });

    it('returns null when photo_path is absent', function() {
      const item = new BaseListItem({ id: 1, name: 'Golden Crown' });

      expect(item.photoUrl).toBeNull();
    });
  });

  describe('#displayText', function() {
    it('defaults to the raw entry name', function() {
      const item = new BaseListItem({ id: 1, name: 'Golden Crown' });

      expect(item.displayText).toBe('Golden Crown');
    });
  });

  describe('#formattedValue', function() {
    it('defaults to null', function() {
      const item = new BaseListItem({ id: 1, name: 'Golden Crown' });

      expect(item.formattedValue).toBeNull();
    });
  });
});
