import commonItemShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/commonItemShowType.js';
import CommonItemPhoto
  from '../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemPhoto.jsx';
import CommonItemNameHeading
  from '../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemNameHeading.jsx';
import CommonItemHiddenField
  from '../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemHiddenField.jsx';
import CommonItemTitle
  from '../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemTitle.jsx';
import CommonItemNameField
  from '../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemNameField.jsx';
import CommonItemPriceField
  from '../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemPriceField.jsx';
import CommonItemCategoryField
  from '../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemCategoryField.jsx';
import CommonItemSubmitButton
  from '../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemSubmitButton.jsx';

describe('commonItemShowType', function() {
  it('offers the photo in the left column for show, edit, and new', function() {
    const photoEntry = commonItemShowType.left.find((entry) => entry === CommonItemPhoto);

    expect(photoEntry.Show).toBeDefined();
    expect(photoEntry.Edit).toBeDefined();
    expect(photoEntry.New).toBeDefined();
  });

  it('shows the name heading only in show mode', function() {
    const nameEntry = commonItemShowType.left.find((entry) => entry.Show === CommonItemNameHeading);

    expect(nameEntry.New).toBeUndefined();
    expect(nameEntry.Edit).toBeUndefined();
  });

  it('places the hidden switch under the photo only in edit mode', function() {
    const hiddenEntry = commonItemShowType.left.find((entry) => entry.Edit === CommonItemHiddenField);

    expect(hiddenEntry.Show).toBeUndefined();
    expect(hiddenEntry.New).toBeUndefined();
  });

  it('places the hidden switch inline with the other fields in new mode', function() {
    const hiddenEntry = commonItemShowType.right.find((entry) => entry.New === CommonItemHiddenField);

    expect(hiddenEntry.Show).toBeUndefined();
    expect(hiddenEntry.Edit).toBeUndefined();
  });

  it('shares the title between new and edit', function() {
    const titleEntry = commonItemShowType.right.find((entry) => entry.New === CommonItemTitle);

    expect(titleEntry.Edit).toBe(CommonItemTitle);
  });

  it('shares the name field between new and edit', function() {
    const nameEntry = commonItemShowType.right.find((entry) => entry.New === CommonItemNameField);

    expect(nameEntry.Edit).toBe(CommonItemNameField);
  });

  it('offers the price field in every mode', function() {
    const priceEntry = commonItemShowType.right.find((entry) => entry === CommonItemPriceField);

    expect(priceEntry.Show).toBeDefined();
    expect(priceEntry.New).toBeDefined();
    expect(priceEntry.Edit).toBeDefined();
  });

  it('offers the category field in every mode', function() {
    const categoryEntry = commonItemShowType.right.find((entry) => entry === CommonItemCategoryField);

    expect(categoryEntry.Show).toBeDefined();
    expect(categoryEntry.New).toBeDefined();
    expect(categoryEntry.Edit).toBeDefined();
  });

  it('shares the submit button between new and edit', function() {
    const submitEntry = commonItemShowType.right.find((entry) => entry.New === CommonItemSubmitButton);

    expect(submitEntry.Edit).toBe(CommonItemSubmitButton);
  });

  it('has no bottom-slot content', function() {
    expect(commonItemShowType.bottom).toEqual([]);
  });
});
