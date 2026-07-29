import documentShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/documentShowType.js';
import DocumentPhoto
  from '../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentPhoto.jsx';
import DocumentNameHeading
  from '../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentNameHeading.jsx';
import DocumentTitle
  from '../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentTitle.jsx';
import DocumentNameField
  from '../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentNameField.jsx';
import DocumentDescriptionField
  from '../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentDescriptionField.jsx';
import DocumentHiddenField
  from '../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentHiddenField.jsx';
import DocumentSubmitButton
  from '../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentSubmitButton.jsx';
import DescriptionBox from '../../../../../../../../assets/js/components/common/misc/DescriptionBox.jsx';
import DocumentPhotosPreview
  from '../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentPhotosPreview.jsx';
import DocumentFilesPreview
  from '../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentFilesPreview.jsx';

describe('documentShowType', function() {
  it('offers the photo in the left column for show, edit, and new', function() {
    const photoEntry = documentShowType.left.find((entry) => entry === DocumentPhoto);

    expect(photoEntry.Show).toBeDefined();
    expect(photoEntry.Edit).toBeDefined();
    expect(photoEntry.New).toBeDefined();
  });

  it('shows the name heading in show and edit mode, but not new', function() {
    const nameEntry = documentShowType.left.find((entry) => entry.Show === DocumentNameHeading);

    expect(nameEntry.Edit).toBe(DocumentNameHeading);
    expect(nameEntry.New).toBeUndefined();
  });

  it('renders the title only in new mode', function() {
    const titleEntry = documentShowType.right.find((entry) => entry.New === DocumentTitle);

    expect(titleEntry.Show).toBeUndefined();
    expect(titleEntry.Edit).toBeUndefined();
  });

  it('renders the name field only in new mode', function() {
    const nameEntry = documentShowType.right.find((entry) => entry.New === DocumentNameField);

    expect(nameEntry.Show).toBeUndefined();
    expect(nameEntry.Edit).toBeUndefined();
  });

  it('shows the description via DescriptionBox in show and edit mode, and edits it via DocumentDescriptionField in new mode', function() {
    const descriptionEntry = documentShowType.right.find(
      (entry) => entry.Show === DescriptionBox,
    );

    expect(descriptionEntry.Edit).toBe(DescriptionBox);
    expect(descriptionEntry.New).toBe(DocumentDescriptionField);
  });

  it('renders the hidden switch only in new mode, inline with the other fields', function() {
    const hiddenEntry = documentShowType.right.find((entry) => entry.New === DocumentHiddenField);

    expect(hiddenEntry.Show).toBeUndefined();
    expect(hiddenEntry.Edit).toBeUndefined();
  });

  it('renders the submit button only in new mode', function() {
    const submitEntry = documentShowType.right.find((entry) => entry.New === DocumentSubmitButton);

    expect(submitEntry.Show).toBeUndefined();
    expect(submitEntry.Edit).toBeUndefined();
  });

  it('shows the photos and files shortlists only in show mode (issue #873)', function() {
    const photosEntry = documentShowType.bottom.find((entry) => entry.Show === DocumentPhotosPreview);
    const filesEntry = documentShowType.bottom.find((entry) => entry.Show === DocumentFilesPreview);

    expect(photosEntry).toBeDefined();
    expect(photosEntry.Edit).toBeUndefined();
    expect(photosEntry.New).toBeUndefined();
    expect(filesEntry).toBeDefined();
    expect(filesEntry.Edit).toBeUndefined();
    expect(filesEntry.New).toBeUndefined();
  });

  it('shows the files shortlist before the photos shortlist (issue #897)', function() {
    const filesEntry = documentShowType.bottom.find((entry) => entry.Show === DocumentFilesPreview);
    const photosEntry = documentShowType.bottom.find((entry) => entry.Show === DocumentPhotosPreview);

    expect(documentShowType.bottom.indexOf(filesEntry)).toBeLessThan(documentShowType.bottom.indexOf(photosEntry));
  });
});
