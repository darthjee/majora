import React from 'react';
import EditButton from '../../../../common/buttons/EditButton.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Noop from '../../../../../utils/Noop.js';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the game document detail page (issue #758, photo upload and Edit button
 * added in #727): mirrors `ItemDetailHelper`, but simpler — no separate `canEdit` flag, since the
 * Edit button reuses the same `canUploadPhoto` gate (there is no separate general "edit"
 * permission for documents).
 */
export default class DocumentDetailHelper {
  /**
   * Render the document detail view through `ShowPageLayout`: a back button (plus an Edit button
   * when `canUploadPhoto` is true), then a two-column row with the document's photo/name on the
   * left and its description on the right.
   *
   * @param {object} document - Document data object (`GameDocument` shape).
   * @param {string} document.name - Document name.
   * @param {string} [document.description] - Document description.
   * @param {string|null} [document.photo_path] - Document photo URL, or null/undefined to fall
   *   back to the default document placeholder image.
   * @param {boolean} [document.hidden] - Whether the document is hidden from players (DM/admin-
   *   facing data only, present only in the `/full.json` variant).
   * @param {string} backHref - Hash path to the document's parent list page.
   * @param {string} [editHref] - Hash path to the document's edit page. Only needed when
   *   `canUploadPhoto` is true.
   * @param {boolean} [canUploadPhoto] - Whether the current user may upload a new photo, also
   *   gating the Edit button rendered alongside the back button — intentional, not a typo: there
   *   is no separate general "edit" permission for documents. Defaults to `false`.
   * @param {Function} [onUploadClick] - Handler invoked when the upload button is clicked.
   *   Defaults to a no-op, matching the `canUploadPhoto` default.
   * @returns {React.ReactElement} Document detail element.
   */
  static render(document, backHref, editHref, canUploadPhoto = false, onUploadClick = Noop.noop) {
    return (
      <ShowPageLayout
        type="document"
        mode="show"
        backHref={backHref}
        pageActions={(
          <ConditionalComponent render={canUploadPhoto}>
            <EditButton href={editHref}>
              {Translator.t('character_page.edit')}
            </EditButton>
          </ConditionalComponent>
        )}
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
