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

describe('documentShowType', function() {
  it('offers the photo in the left column, only for show (no new/edit photo variant)', function() {
    const photoEntry = documentShowType.left.find((entry) => entry === DocumentPhoto);

    expect(photoEntry.Show).toBeDefined();
    expect(photoEntry.New).toBeUndefined();
    expect(photoEntry.Edit).toBeUndefined();
  });

  it('shows the name heading only in show mode', function() {
    const nameEntry = documentShowType.left.find((entry) => entry.Show === DocumentNameHeading);

    expect(nameEntry.New).toBeUndefined();
    expect(nameEntry.Edit).toBeUndefined();
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

  it('shows the description via DescriptionBox and edits it via DocumentDescriptionField in new mode', function() {
    const descriptionEntry = documentShowType.right.find(
      (entry) => entry.Show === DescriptionBox,
    );

    expect(descriptionEntry.New).toBe(DocumentDescriptionField);
    expect(descriptionEntry.Edit).toBeUndefined();
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

  it('has no bottom-slot content', function() {
    expect(documentShowType.bottom).toEqual([]);
  });
});
