import CharacterDocumentListItem
  from '../../../../../../assets/js/components/common/list_types/CharacterDocumentListItem.js';
import BaseListItem from '../../../../../../assets/js/components/common/list_types/BaseListItem.js';

describe('CharacterDocumentListItem', function() {
  it('extends BaseListItem', function() {
    const item = new CharacterDocumentListItem({ id: 1, game_document_id: 5, name: 'Ancient Tome' });

    expect(item instanceof BaseListItem).toBe(true);
  });

  it('inherits photoUrl/displayText from BaseListItem', function() {
    const item = new CharacterDocumentListItem({
      id: 1, game_document_id: 5, name: 'Ancient Tome', photo_path: '/photos/1.png',
    });

    expect(item.photoUrl).toBe('/photos/1.png');
    expect(item.displayText).toBe('Ancient Tome');
  });

  describe('#hidden', function() {
    it('is true when the raw entry is hidden', function() {
      const item = new CharacterDocumentListItem({
        id: 1, game_document_id: 5, name: 'Ancient Tome', hidden: true,
      });

      expect(item.hidden).toBe(true);
    });

    it('is false when the raw entry is not hidden', function() {
      const item = new CharacterDocumentListItem({ id: 1, game_document_id: 5, name: 'Ancient Tome' });

      expect(item.hidden).toBe(false);
    });
  });
});
