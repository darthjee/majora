import DescriptionBox from '../../../misc/DescriptionBox.jsx';
import CommonItemPhoto from '../../../../resources/common_item/pages/elements/show/CommonItemPhoto.jsx';
import CommonItemNameHeading from '../../../../resources/common_item/pages/elements/show/CommonItemNameHeading.jsx';
import CommonItemTitle from '../../../../resources/common_item/pages/elements/show/CommonItemTitle.jsx';
import CommonItemNameField from '../../../../resources/common_item/pages/elements/show/CommonItemNameField.jsx';
import CommonItemDescriptionField
  from '../../../../resources/common_item/pages/elements/show/CommonItemDescriptionField.jsx';
import CommonItemPriceField from '../../../../resources/common_item/pages/elements/show/CommonItemPriceField.jsx';
import CommonItemCategoryField
  from '../../../../resources/common_item/pages/elements/show/CommonItemCategoryField.jsx';
import CommonItemHiddenField from '../../../../resources/common_item/pages/elements/show/CommonItemHiddenField.jsx';
import CommonItemSubmitButton
  from '../../../../resources/common_item/pages/elements/show/CommonItemSubmitButton.jsx';

/**
 * `showTypeConfig` entry for the `commonItem` show/new/edit pages (issue #826), mirroring
 * `possessionShowType`'s own shape, plus `price`/`category` fields — `GameCommonItem` shares the
 * same `name`/`description`/`photo_path`/optional `hidden` fields as `GamePossession`, with no
 * character-owned variant to share this config with either.
 *
 * The show/edit layout keeps the common item's name next to its photo in the left column
 * (matching `possessionShowType`'s own layout). The edit form keeps the `hidden` switch under the
 * photo in the left column, while the creation form shows a deferred photo picker
 * (`CommonItemPhoto`'s `New` variant) in the left column too, keeping the `hidden` switch inline
 * with the other fields in the right column. `price`/`category` render in every mode (`Show`
 * included), unlike `possessionShowType`'s fields, since browsing/knowing an item's price and
 * category is the whole point of this catalog.
 */
const commonItemShowType = {
  left: [
    CommonItemPhoto,
    { Show: CommonItemNameHeading },
    { Edit: CommonItemHiddenField },
  ],
  right: [
    { New: CommonItemTitle, Edit: CommonItemTitle },
    { New: CommonItemNameField, Edit: CommonItemNameField },
    { Show: DescriptionBox, New: CommonItemDescriptionField, Edit: CommonItemDescriptionField },
    CommonItemPriceField,
    CommonItemCategoryField,
    { New: CommonItemHiddenField },
    { New: CommonItemSubmitButton, Edit: CommonItemSubmitButton },
  ],
  bottom: [],
};

export default commonItemShowType;
