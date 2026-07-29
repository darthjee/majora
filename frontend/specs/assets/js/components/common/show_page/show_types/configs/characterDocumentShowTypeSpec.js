import characterDocumentShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/characterDocumentShowType.js';
import CharacterDocumentPhoto
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDocumentPhoto.jsx';
import CharacterDocumentNameHeading
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDocumentNameHeading.jsx';

describe('characterDocumentShowType', function() {
  it('offers the photo in the left column', function() {
    expect(characterDocumentShowType.left).toContain(CharacterDocumentPhoto);
  });

  it('offers the name heading in the left column, next to the photo', function() {
    expect(characterDocumentShowType.left).toContain(CharacterDocumentNameHeading);
  });

  it('has no right-column content', function() {
    expect(characterDocumentShowType.right).toEqual([]);
  });

  it('has no bottom-slot content', function() {
    expect(characterDocumentShowType.bottom).toEqual([]);
  });
});
