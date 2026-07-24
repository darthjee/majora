import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game document detail page (issue #758): mirrors `ItemDetailHelper`,
 * but simpler — no edit button, no photo upload affordance (both out of scope for this issue).
 */
export default class DocumentDetailHelper {
  /**
   * Render the document detail view through `ShowPageLayout`: a back button, then a two-column
   * row with the document's photo/name on the left and its description on the right.
   *
   * @param {object} document - Document data object (`GameDocument` shape).
   * @param {string} document.name - Document name.
   * @param {string} [document.description] - Document description.
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
        type="document"
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
