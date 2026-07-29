import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the PC/NPC document detail page (issue #892), shared by
 * `PcCharacterDocument` and `NpcCharacterDocument` (via the shared `CharacterDocument` page
 * component), mirroring `ItemDetailHelper`'s shape but simpler: no photo upload, no Edit button
 * — `CharacterDocument` has nothing left to edit once its `name`/`description`/`photo` overrides
 * were removed, and no edit route exists for it. Renders through the dedicated
 * `character_document` `showTypeConfig` entry (`characterDocumentShowType.js`), not the unrelated
 * `document` entry backing the `GameDocument` show/new/edit page.
 */
export default class CharacterDocumentDetailHelper {
  /**
   * Render the document detail view through `ShowPageLayout`: a back button, then the document's
   * photo/name in the left column, with nothing in the right column or below.
   *
   * @param {object} document - `CharacterDocument` data object.
   * @param {string} document.name - Document name.
   * @param {string|null} [document.photo_path] - Document photo URL, or null/undefined to fall
   *   back to the default document placeholder image.
   * @param {boolean} [document.hidden] - Whether the document is hidden from players (DM/admin-
   *   facing data only, present only in the `/full.json` variant).
   * @param {string} backHref - Hash path to the document's parent list page.
   * @returns {React.ReactElement} Document detail element.
   */
  static render(document, backHref) {
    return (
      <ShowPageLayout
        type="character_document"
        mode="show"
        backHref={backHref}
        context={{ ...document }}
      />
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('character_document_page.loading')} />;
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return <ErrorAlert error={error} />;
  }
}
