import React from 'react';
import EditButton from '../../../../common/buttons/EditButton.jsx';
import UploadButton from '../../../../common/buttons/UploadButton.jsx';
import ConditionalComponent from '../../../../common/misc/ConditionalComponent.jsx';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import Noop from '../../../../../utils/Noop.js';
import Translator from '../../../../../i18n/Translator.js';
import Icons from '../../../../../utils/ui/Icons.js';

/**
 * Rendering helper for the game document detail page (issue #758, photo upload and Edit button
 * added in #727; file-upload button added in #726; Give Document button added in #1005): mirrors
 * `ItemDetailHelper`, but simpler — no separate `canEdit` flag, since the Edit button (and the
 * file-upload and Give Document buttons) all reuse the same `canUploadPhoto` gate (there is no
 * separate general "edit"/"upload file" permission for documents; see
 * `docs/agents/plans/726-add-document-file-upload/plan.md`'s "Permissions" section).
 */
export default class DocumentDetailHelper {
  /**
   * Render the document detail view through `ShowPageLayout`: a back button (plus Edit and
   * file-upload buttons when `canUploadPhoto` is true), then a two-column row with the document's
   * photo/name on the left and its description on the right.
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
   *   gating the Edit and file-upload buttons rendered alongside the back button —
   *   intentional, not a typo: there is no separate general "edit"/"upload file" permission for
   *   documents. Defaults to `false`.
   * @param {Function} [onUploadClick] - Handler invoked when the photo upload button/photo is
   *   clicked. Defaults to a no-op, matching the `canUploadPhoto` default.
   * @param {Function} [onFileUploadClick] - Handler invoked when the file-upload button is
   *   clicked (issue #726). Defaults to a no-op, matching the `canUploadPhoto` default.
   * @param {string} [gameSlug] - Game slug the document belongs to, merged into the rendering
   *   context as `game_slug` (issue #873) — the `GameDocument` payload itself carries no
   *   `game_slug` field, unlike a character's own detail payload, so the bottom photo/file
   *   shortlist slots (`DocumentPhotosPreview`/`DocumentFilesPreview`) need it passed in
   *   explicitly by the caller, which already resolves it from the current hash.
   * @param {Function} [onSelectPhoto] - Handler invoked with a photo when a photo shortlist card
   *   is clicked, merged into `context.handlers` alongside `onOpenUploadModal` (issue #873).
   *   Defaults to a no-op.
   * @param {Function} [onGiveDocumentClick] - Handler invoked when the "Give Document" button is
   *   clicked (issue #1005), gated the same way as the Edit/file-upload buttons. Defaults to a
   *   no-op.
   * @returns {React.ReactElement} Document detail element.
   */
  static render(
    document, backHref, editHref, canUploadPhoto = false, onUploadClick = Noop.noop,
    onFileUploadClick = Noop.noop, gameSlug, onSelectPhoto = Noop.noop, onGiveDocumentClick = Noop.noop,
  ) {
    return (
      <ShowPageLayout
        type="document"
        mode="show"
        backHref={backHref}
        pageActions={DocumentDetailHelper.#renderPageActions(
          canUploadPhoto, editHref, onFileUploadClick, onGiveDocumentClick,
        )}
        context={{
          ...document,
          canUploadPhoto,
          // issue #1129: `DocumentPagesBox`'s own "Edit pages" entry point is gated the same
          // broad way as `canUploadPhoto` — there is no separate general "edit" permission for
          // documents — but threaded through under its own name since `DocumentPagesBox` is
          // resource-agnostic and shouldn't assume anything document-photo-specific about the
          // flag it receives.
          canEditPages: canUploadPhoto,
          game_slug: gameSlug,
          handlers: { onOpenUploadModal: onUploadClick, onSelectPhoto },
        }}
      />
    );
  }

  static #renderPageActions(canUploadPhoto, editHref, onFileUploadClick, onGiveDocumentClick) {
    return (
      <>
        <ConditionalComponent render={canUploadPhoto}>
          <button type="button" className="btn btn-primary mb-3" onClick={onGiveDocumentClick}>
            {Translator.t('give_document_modal.title')}
          </button>
        </ConditionalComponent>
        <ConditionalComponent render={canUploadPhoto}>
          <EditButton href={editHref}>
            {Translator.t('character_page.edit')}
          </EditButton>
        </ConditionalComponent>
        <ConditionalComponent render={canUploadPhoto}>
          <UploadButton onClick={onFileUploadClick} label={Translator.t('file_upload_modal.title')}>
            <i className={`bi ${Icons.filePdf}`} aria-hidden="true"></i>
          </UploadButton>
        </ConditionalComponent>
      </>
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
