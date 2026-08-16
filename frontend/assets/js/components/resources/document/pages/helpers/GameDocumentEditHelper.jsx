import React from 'react';
import ErrorAlert from '../../../../common/misc/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/misc/LoadingMessage.jsx';
import ShowPageLayout from '../../../../common/show_page/ShowPageLayout.jsx';
import DocumentPagesEditBox from '../elements/edit/DocumentPagesEditBox.jsx';
import DocumentPagesSaveFailedAlert from '../elements/show/DocumentPagesSaveFailedAlert.jsx';
import Translator from '../../../../../i18n/Translator.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Rendering helper for the game document edit page (issue #727, opt-in pages editor added in
 * #1129) — still photo-upload-only for the document's own `name`/`description`/`hidden` fields
 * (no `PATCH .../documents/:id.json` endpoint exists), but now also renders
 * {@link DocumentPagesEditBox} (read-only "Edit" affordance by default, the full infinite-textarea
 * editor once entered) plus a page-level "Save" button that unconditionally delegates to the
 * pages box's own imperative save entry point — see the issue's "Save orchestration" section.
 */
export default class GameDocumentEditHelper {
  /**
   * Render the document edit view through `ShowPageLayout`: a back button to the document's show
   * page (there is no form submit to redirect away on completion, so the back button is the only
   * way out — unlike `ItemEditHelper`, which has no `backHref`), then a two-column row with the
   * document's photo/name on the left and its (read-only) description on the right, followed by
   * the pages editor and its own Save action/failure alert (issue #1129).
   *
   * @param {object} document - Document data object (`GameDocument` shape).
   * @param {string} document.name - Document name.
   * @param {string} [document.description] - Document description.
   * @param {string|null} [document.photo_path] - Document photo URL, or null/undefined to fall
   *   back to the default document placeholder image.
   * @param {boolean} [document.hidden] - Whether the document is hidden from players.
   * @param {string} backHref - Hash path to the document's show page.
   * @param {boolean} [canUploadPhoto] - Whether the current user may upload a new photo, also
   *   gating the pages-edit affordance and Save button (issue #1129) — there is no separate
   *   general "edit" permission for documents.
   * @param {Function} [onUploadClick] - Handler invoked when the upload button is clicked.
   * @param {object} [pages] - Pages-editor wiring (issue #1129).
   * @param {string} [pages.gameSlug] - Game slug, forwarded to `DocumentPagesEditBox`.
   * @param {React.Ref} [pages.pagesRef] - Imperative handle ref for `DocumentPagesEditBox`.
   * @param {string} [pages.saveStatus] - `'idle'`, `'saving'`, or `'failed'`.
   * @param {Function} [pages.onSave] - Handler for the page-level Save button.
   * @param {Function} [pages.onRetrySave] - Handler for the failure alert's Retry action.
   * @param {Function} [pages.onSkipSave] - Handler for the failure alert's Skip action.
   * @returns {React.ReactElement} Document edit element.
   */
  static render(document, backHref, canUploadPhoto = false, onUploadClick, pages = {}) {
    const {
      gameSlug, pagesRef, saveStatus = 'idle', onSave = Noop.noop, onRetrySave = Noop.noop, onSkipSave = Noop.noop,
    } = pages;

    return (
      <>
        <ShowPageLayout
          type="document"
          mode="edit"
          backHref={backHref}
          context={{ ...document, canUploadPhoto, handlers: { onOpenUploadModal: onUploadClick } }}
        />
        <div className="container">
          <DocumentPagesEditBox
            ref={pagesRef}
            gameSlug={gameSlug}
            id={document?.id}
            canEditPages={canUploadPhoto}
          />
          {GameDocumentEditHelper.#renderSaveButton(canUploadPhoto, saveStatus, onSave)}
          {GameDocumentEditHelper.#renderPagesSaveFailedAlert(saveStatus, onRetrySave, onSkipSave)}
        </div>
      </>
    );
  }

  static #renderSaveButton(canUploadPhoto, saveStatus, onSave) {
    if (!canUploadPhoto) {
      return null;
    }

    return (
      <button type="button" className="btn btn-primary mt-3" onClick={onSave} disabled={saveStatus === 'saving'}>
        {Translator.t('document_edit_page.save')}
      </button>
    );
  }

  static #renderPagesSaveFailedAlert(saveStatus, onRetrySave, onSkipSave) {
    if (saveStatus !== 'failed') {
      return null;
    }

    return <DocumentPagesSaveFailedAlert onRetry={onRetrySave} onSkip={onSkipSave} />;
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
