import characterDocumentShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/characterDocumentShowType.js';
import CharacterDocumentPhoto
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDocumentPhoto.jsx';
import CharacterDocumentNameHeading
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDocumentNameHeading.jsx';
import CharacterDocumentFilesPreview
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDocumentFilesPreview.jsx';
import CharacterDocumentPhotosPreview
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDocumentPhotosPreview.jsx';
import CharacterDocumentPagesBox
  from '../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDocumentPagesBox.jsx';
import DescriptionBox
  from '../../../../../../../../assets/js/components/common/misc/DescriptionBox.jsx';

describe('characterDocumentShowType', function() {
  it('offers the photo in the left column', function() {
    expect(characterDocumentShowType.left).toContain(CharacterDocumentPhoto);
  });

  it('offers the name heading in the left column, next to the photo', function() {
    expect(characterDocumentShowType.left).toContain(CharacterDocumentNameHeading);
  });

  it('shows the description via DescriptionBox in the right column, show mode only', function() {
    const descriptionEntry = characterDocumentShowType.right.find((entry) => entry.Show === DescriptionBox);

    expect(descriptionEntry).toBeDefined();
    expect(descriptionEntry.Edit).toBeUndefined();
    expect(descriptionEntry.New).toBeUndefined();
  });

  it('shows the files shortlist before the photos shortlist in the bottom slot, show mode only (issue #897)', function() {
    const filesEntry = characterDocumentShowType.bottom.find((entry) => entry.Show === CharacterDocumentFilesPreview);
    const photosEntry = characterDocumentShowType.bottom
      .find((entry) => entry.Show === CharacterDocumentPhotosPreview);

    expect(filesEntry).toBeDefined();
    expect(photosEntry).toBeDefined();
    expect(characterDocumentShowType.bottom.indexOf(filesEntry))
      .toBeLessThan(characterDocumentShowType.bottom.indexOf(photosEntry));
    expect(filesEntry.Edit).toBeUndefined();
    expect(filesEntry.New).toBeUndefined();
    expect(photosEntry.Edit).toBeUndefined();
    expect(photosEntry.New).toBeUndefined();
  });

  it('shows the pages box in the right column, below the description, in show mode (issue #1127, moved from bottom by #776)', function() {
    const descriptionEntry = characterDocumentShowType.right.find((entry) => entry.Show === DescriptionBox);
    const pagesEntry = characterDocumentShowType.right.find((entry) => entry.Show === CharacterDocumentPagesBox);

    expect(pagesEntry).toBeDefined();
    expect(pagesEntry.Edit).toBeUndefined();
    expect(pagesEntry.New).toBeUndefined();
    expect(characterDocumentShowType.right.indexOf(pagesEntry))
      .toBeGreaterThan(characterDocumentShowType.right.indexOf(descriptionEntry));
  });

  it('no longer renders the pages content in the bottom slot (issue #776)', function() {
    const pagesEntry = characterDocumentShowType.bottom.find((entry) => entry.Show === CharacterDocumentPagesBox);

    expect(pagesEntry).toBeUndefined();
  });
});
