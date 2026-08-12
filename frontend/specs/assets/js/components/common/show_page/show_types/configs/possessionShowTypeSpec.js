import possessionShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/possessionShowType.js';
import PossessionPhoto
  from '../../../../../../../../assets/js/components/resources/possession/pages/elements/show/PossessionPhoto.jsx';
import PossessionNameHeading
  from '../../../../../../../../assets/js/components/resources/possession/pages/elements/show/PossessionNameHeading.jsx';
import PossessionHiddenField
  from '../../../../../../../../assets/js/components/resources/possession/pages/elements/show/PossessionHiddenField.jsx';
import PossessionTitle
  from '../../../../../../../../assets/js/components/resources/possession/pages/elements/show/PossessionTitle.jsx';
import PossessionNameField
  from '../../../../../../../../assets/js/components/resources/possession/pages/elements/show/PossessionNameField.jsx';
import PossessionSubmitButton
  from '../../../../../../../../assets/js/components/resources/possession/pages/elements/show/PossessionSubmitButton.jsx';

describe('possessionShowType', function() {
  it('offers the photo in the left column for show, edit, and new', function() {
    const photoEntry = possessionShowType.left.find((entry) => entry === PossessionPhoto);

    expect(photoEntry.Show).toBeDefined();
    expect(photoEntry.Edit).toBeDefined();
    expect(photoEntry.New).toBeDefined();
  });

  it('shows the name heading only in show mode', function() {
    const nameEntry = possessionShowType.left.find((entry) => entry.Show === PossessionNameHeading);

    expect(nameEntry.New).toBeUndefined();
    expect(nameEntry.Edit).toBeUndefined();
  });

  it('places the hidden switch under the photo only in edit mode', function() {
    const hiddenEntry = possessionShowType.left.find((entry) => entry.Edit === PossessionHiddenField);

    expect(hiddenEntry.Show).toBeUndefined();
    expect(hiddenEntry.New).toBeUndefined();
  });

  it('places the hidden switch inline with the other fields in new mode', function() {
    const hiddenEntry = possessionShowType.right.find((entry) => entry.New === PossessionHiddenField);

    expect(hiddenEntry.Show).toBeUndefined();
    expect(hiddenEntry.Edit).toBeUndefined();
  });

  it('shares the title between new and edit', function() {
    const titleEntry = possessionShowType.right.find((entry) => entry.New === PossessionTitle);

    expect(titleEntry.Edit).toBe(PossessionTitle);
  });

  it('shares the name field between new and edit', function() {
    const nameEntry = possessionShowType.right.find((entry) => entry.New === PossessionNameField);

    expect(nameEntry.Edit).toBe(PossessionNameField);
  });

  it('shares the submit button between new and edit', function() {
    const submitEntry = possessionShowType.right.find((entry) => entry.New === PossessionSubmitButton);

    expect(submitEntry.Edit).toBe(PossessionSubmitButton);
  });

  it('has no bottom-slot content', function() {
    expect(possessionShowType.bottom).toEqual([]);
  });
});
