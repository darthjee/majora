import React from 'react';
import ActionsOverlay from '../../../../../common/misc/ActionsOverlay.jsx';
import ItemCardHelper from '../../../../../common/list_types/ItemCardHelper.jsx';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode left-column slot: the item's photo, with an upload affordance gated on the
 * requester's own upload permission (`canUploadPhoto`, resolved per-page) and a Hidden badge
 * when the item is hidden from players, delegating to `ItemCardHelper` the same way the item
 * list page already does.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.photo_path] - Item photo URL.
 * @param {string} context.name - Item name, used as the image's alt text.
 * @param {boolean} [context.hidden] - Whether the item is hidden from players.
 * @param {boolean} [context.canUploadPhoto] - Whether the current user may upload a new photo.
 * @param {{onOpenUploadModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Item photo overlay element.
 */
function ItemPhotoShow({
  photo_path: photoPath, name, hidden, canUploadPhoto, handlers,
}) {
  return (
    <ActionsOverlay
      type="item"
      url={photoPath}
      alt={name}
      canEdit={Boolean(canUploadPhoto)}
      onClick={handlers.onOpenUploadModal}
      infoBarItems={ItemCardHelper.buildInfoBarItems({ hidden }, Translator.t('item_page.hidden_label'))}
    />
  );
}

/**
 * Edit-mode left-column slot: the item's photo, always editable (the edit route is already
 * permission-gated), dimmed whenever the `hidden` switch is on — matching the existing behavior
 * `ItemEditHelper` already had before this migration.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.photo_path] - Item photo URL.
 * @param {string} context.name - Item name, used as the image's alt text.
 * @param {boolean} [context.hidden] - Whether the item is currently marked hidden.
 * @param {{onOpenUploadModal: Function}} context.handlers - Event handlers.
 * @returns {React.ReactElement} Item photo overlay element.
 */
function ItemPhotoEdit({
  photo_path: photoPath, name, hidden, handlers,
}) {
  return (
    <ActionsOverlay
      type="item"
      url={photoPath}
      alt={name}
      canEdit
      onClick={handlers.onOpenUploadModal}
      dimmed={hidden}
    />
  );
}

/**
 * Mode-variant photo slot for the item show/edit pages. There is no `New` variant: item creation
 * has no photo yet (there's no item id to upload a photo against until it's created), matching
 * `CharacterItemNewHelper`'s existing form, which has no photo/upload affordance at all.
 */
const ItemPhoto = { Show: ItemPhotoShow, Edit: ItemPhotoEdit };

export default ItemPhoto;
