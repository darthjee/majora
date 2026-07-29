import React from 'react';
import ActionsOverlay from '../../../../../common/misc/ActionsOverlay.jsx';
import ItemCardHelper from '../../../../../common/list_types/ItemCardHelper.jsx';
import Translator from '../../../../../../i18n/Translator.js';
import Noop from '../../../../../../utils/Noop.js';

/**
 * Show-mode left-column slot: a `CharacterDocument`'s photo, with a Hidden badge when the
 * document is hidden from players (DM/admin-facing data only, present solely in the
 * `/full.json` variant), delegating to `ItemCardHelper` the same way `DocumentPhotoShow` does.
 * Unlike `DocumentPhotoShow` (the unrelated `GameDocument` show page's own photo slot), this has
 * no upload affordance at all — a `CharacterDocument` no longer carries a photo of its own to
 * upload since issue #892 (its `photo_path` is sourced directly from the linked `GameDocument`).
 * This page has no `Edit`/`New` mode counterpart, so this slot is registered as a plain
 * (mode-invariant) component rather than a `{Show, Edit, New}` mode-variant object.
 *
 * @param {object} context - Merged `ShowPageLayout` rendering context.
 * @param {string|null} [context.photo_path] - Document photo URL.
 * @param {string} context.name - Document name, used as the image's alt text.
 * @param {boolean} [context.hidden] - Whether the document is hidden from players.
 * @returns {React.ReactElement} Document photo overlay element.
 */
export default function CharacterDocumentPhoto({ photo_path: photoPath, name, hidden }) {
  return (
    <ActionsOverlay
      type="document"
      url={photoPath}
      alt={name}
      canEdit={false}
      onClick={Noop.noop}
      infoBarItems={ItemCardHelper.buildInfoBarItems({ hidden }, Translator.t('character_document_page.hidden_label'))}
    />
  );
}
