import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game document edit page (issue #727) — photo-upload-only, since no
 * `PATCH .../documents/:id.json` endpoint exists yet.
 */
export default class GameDocumentEditHelper {
  /**
   * Render the document edit view through `ShowPageLayout`: a back button to the document's show
   * page (there is no form submit to redirect away on completion, so the back button is the only
   * way out — unlike `ItemEditHelper`, which has no `backHref`), then a two-column row with the
   * document's photo/name on the left and its (read-only) description on the right.
   *
   * @param {object} document - Document data object (`GameDocument` shape).
   * @param {string} document.name - Document name.
   * @param {string} [document.description] - Document description.
   * @param {string|null} [document.photo_path] - Document photo URL, or null/undefined to fall
   *   back to the default document placeholder image.
   * @param {boolean} [document.hidden] - Whether the document is hidden from players.
   * @param {string} backHref - Hash path to the document's show page.
   * @param {boolean} [canUploadPhoto] - Whether the current user may upload a new photo.
   * @param {Function} [onUploadClick] - Handler invoked when the upload button is clicked.
   * @returns {React.ReactElement} Document edit element.
   */
  static render(document, backHref, canUploadPhoto = false, onUploadClick) {
    return (
      <ShowPageLayout
        type="document"
        mode="edit"
        backHref={backHref}
        context={{ ...document, canUploadPhoto, handlers: { onOpenUploadModal: onUploadClick } }}
      />
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('document_page.loading')} />;
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
