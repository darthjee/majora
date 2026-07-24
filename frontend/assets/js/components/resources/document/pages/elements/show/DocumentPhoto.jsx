import React from 'react';
import ActionsOverlay from '../../../../../common/misc/ActionsOverlay.jsx';
import ItemCardHelper from '../../../../../common/list_types/ItemCardHelper.jsx';
import Noop from '../../../../../../utils/Noop.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Show-mode left-column slot: the document's photo, with a Hidden badge when the document is
 * hidden from players (present only on the DM/admin-facing `full.json` response), delegating to
 * `ItemCardHelper` the same way `ItemPhoto` does — its badge logic is generic (any object
 * carrying a `hidden` flag), not item-specific. No upload affordance in this issue (issue #758
 * scope decision), unlike `ItemPhoto`'s `canUploadPhoto`-gated overlay button.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.photo_path] - Document photo URL.
 * @param {string} context.name - Document name, used as the image's alt text.
 * @param {boolean} [context.hidden] - Whether the document is hidden from players.
 * @returns {React.ReactElement} Document photo overlay element.
 */
function DocumentPhotoShow({
  photo_path: photoPath, name, hidden,
}) {
  return (
    <ActionsOverlay
      type="document"
      url={photoPath}
      alt={name}
      canEdit={false}
      onClick={Noop.noop}
      infoBarItems={ItemCardHelper.buildInfoBarItems({ hidden }, Translator.t('document_page.hidden_label'))}
    />
  );
}

/**
 * Mode-variant photo slot for the document show page — no `New`/`Edit` variant, since document
 * creation has no photo picker (issue #758 scope decision) and there is no edit mode at all.
 */
const DocumentPhoto = { Show: DocumentPhotoShow };

export default DocumentPhoto;
