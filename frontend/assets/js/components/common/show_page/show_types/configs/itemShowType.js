import DescriptionBox from '../../../misc/DescriptionBox.jsx';
import ItemPhoto from '../../../../resources/item/pages/elements/show/ItemPhoto.jsx';
import ItemNameHeading from '../../../../resources/item/pages/elements/show/ItemNameHeading.jsx';
import ItemTitle from '../../../../resources/item/pages/elements/show/ItemTitle.jsx';
import ItemNameField from '../../../../resources/item/pages/elements/show/ItemNameField.jsx';
import ItemDescriptionField from '../../../../resources/item/pages/elements/show/ItemDescriptionField.jsx';
import ItemHiddenField from '../../../../resources/item/pages/elements/show/ItemHiddenField.jsx';
import ItemSubmitButton from '../../../../resources/item/pages/elements/show/ItemSubmitButton.jsx';

/**
 * `showTypeConfig` entry for the `item` show/new/edit pages, shared by `game-item`, `pc-item`,
 * and `npc-item` alike (the layout and fields — `name`, `description`, `photo_path`, optional
 * `hidden` — are identical across all three response shapes, mirroring `ItemDetailHelper`'s and
 * `ItemEditHelper`'s existing sharing). The `New` variants below are reached both from the PC/NPC
 * item creation route (`CharacterItemNew`) and, since issue #784, from the game-level item
 * creation route (`GameItemNew`), which creates a bare `GameItem` with no owning `CharacterItem`.
 *
 * The show/edit layout keeps the item's name next to its photo in the left column (unlike
 * `game`/`pc`/`npc`, whose name heading lives in the right column), matching `ItemDetailHelper`'s
 * existing layout. The edit form keeps the `hidden` switch under the photo in the left column
 * (matching `ItemEditHelper`), while the creation form now shows a deferred photo picker
 * (`ItemPhoto`'s `New` variant) in the left column too, but still keeps the `hidden` switch inline
 * with the other fields in the right column (matching `CharacterItemNewHelper`).
 */
const itemShowType = {
  left: [
    ItemPhoto,
    { Show: ItemNameHeading },
    { Edit: ItemHiddenField },
  ],
  right: [
    { New: ItemTitle, Edit: ItemTitle },
    { New: ItemNameField, Edit: ItemNameField },
    { Show: DescriptionBox, New: ItemDescriptionField, Edit: ItemDescriptionField },
    { New: ItemHiddenField },
    { New: ItemSubmitButton, Edit: ItemSubmitButton },
  ],
  bottom: [],
};

export default itemShowType;
