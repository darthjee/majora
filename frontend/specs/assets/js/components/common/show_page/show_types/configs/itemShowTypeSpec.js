import itemShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/itemShowType.js';
import ItemPhoto
  from '../../../../../../../../assets/js/components/resources/item/pages/elements/show/ItemPhoto.jsx';
import ItemNameHeading
  from '../../../../../../../../assets/js/components/resources/item/pages/elements/show/ItemNameHeading.jsx';
import ItemHiddenField
  from '../../../../../../../../assets/js/components/resources/item/pages/elements/show/ItemHiddenField.jsx';
import ItemTitle
  from '../../../../../../../../assets/js/components/resources/item/pages/elements/show/ItemTitle.jsx';
import ItemNameField
  from '../../../../../../../../assets/js/components/resources/item/pages/elements/show/ItemNameField.jsx';
import ItemSubmitButton
  from '../../../../../../../../assets/js/components/resources/item/pages/elements/show/ItemSubmitButton.jsx';

describe('itemShowType', function() {
  it('offers the photo in the left column for show, edit, and new', function() {
    const photoEntry = itemShowType.left.find((entry) => entry === ItemPhoto);

    expect(photoEntry.Show).toBeDefined();
    expect(photoEntry.Edit).toBeDefined();
    expect(photoEntry.New).toBeDefined();
  });

  it('shows the name heading only in show mode', function() {
    const nameEntry = itemShowType.left.find((entry) => entry.Show === ItemNameHeading);

    expect(nameEntry.New).toBeUndefined();
    expect(nameEntry.Edit).toBeUndefined();
  });

  it('places the hidden switch under the photo only in edit mode', function() {
    const hiddenEntry = itemShowType.left.find((entry) => entry.Edit === ItemHiddenField);

    expect(hiddenEntry.Show).toBeUndefined();
    expect(hiddenEntry.New).toBeUndefined();
  });

  it('places the hidden switch inline with the other fields in new mode', function() {
    const hiddenEntry = itemShowType.right.find((entry) => entry.New === ItemHiddenField);

    expect(hiddenEntry.Show).toBeUndefined();
    expect(hiddenEntry.Edit).toBeUndefined();
  });

  it('shares the title between new and edit', function() {
    const titleEntry = itemShowType.right.find((entry) => entry.New === ItemTitle);

    expect(titleEntry.Edit).toBe(ItemTitle);
  });

  it('shares the name field between new and edit', function() {
    const nameEntry = itemShowType.right.find((entry) => entry.New === ItemNameField);

    expect(nameEntry.Edit).toBe(ItemNameField);
  });

  it('shares the submit button between new and edit', function() {
    const submitEntry = itemShowType.right.find((entry) => entry.New === ItemSubmitButton);

    expect(submitEntry.Edit).toBe(ItemSubmitButton);
  });

  it('has no bottom-slot content', function() {
    expect(itemShowType.bottom).toEqual([]);
  });
});
