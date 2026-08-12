import DescriptionBox from '../../../misc/DescriptionBox.jsx';
import PossessionPhoto from '../../../../resources/possession/pages/elements/show/PossessionPhoto.jsx';
import PossessionNameHeading from '../../../../resources/possession/pages/elements/show/PossessionNameHeading.jsx';
import PossessionTitle from '../../../../resources/possession/pages/elements/show/PossessionTitle.jsx';
import PossessionNameField from '../../../../resources/possession/pages/elements/show/PossessionNameField.jsx';
import PossessionDescriptionField
  from '../../../../resources/possession/pages/elements/show/PossessionDescriptionField.jsx';
import PossessionHiddenField from '../../../../resources/possession/pages/elements/show/PossessionHiddenField.jsx';
import PossessionSubmitButton from '../../../../resources/possession/pages/elements/show/PossessionSubmitButton.jsx';

/**
 * `showTypeConfig` entry for the `possession` show/new/edit pages (issue #1074), mirroring
 * `itemShowType`'s own shape exactly — `GamePossession` shares the same `name`/`description`/
 * `photo_path`/optional `hidden` fields as `GameItem`, with no PC/NPC ownership variant to share
 * this config with (unlike `item`, which is also reused by `pc-item`/`npc-item`).
 *
 * The show/edit layout keeps the possession's name next to its photo in the left column (matching
 * `itemShowType`'s own layout, unlike `game`/`pc`/`npc`). The edit form keeps the `hidden` switch
 * under the photo in the left column, while the creation form shows a deferred photo picker
 * (`PossessionPhoto`'s `New` variant) in the left column too, keeping the `hidden` switch inline
 * with the other fields in the right column.
 */
const possessionShowType = {
  left: [
    PossessionPhoto,
    { Show: PossessionNameHeading },
    { Edit: PossessionHiddenField },
  ],
  right: [
    { New: PossessionTitle, Edit: PossessionTitle },
    { New: PossessionNameField, Edit: PossessionNameField },
    { Show: DescriptionBox, New: PossessionDescriptionField, Edit: PossessionDescriptionField },
    { New: PossessionHiddenField },
    { New: PossessionSubmitButton, Edit: PossessionSubmitButton },
  ],
  bottom: [],
};

export default possessionShowType;
