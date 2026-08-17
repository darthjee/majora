import React from 'react';
import DocumentPagesEditBox from '../DocumentPagesEditBox.jsx';
import DocumentPagesSaveFailedAlert from '../../show/DocumentPagesSaveFailedAlert.jsx';
import Translator from '../../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the `DocumentPagesEditSlot` element (issue #1129, extracted from
 * `GameDocumentEditHelper`'s own former `#renderSaveButton`/`#renderPagesSaveFailedAlert` private
 * methods when the pages editor moved into `ShowPageLayout`'s `right` column, issue #776).
 */
export default class DocumentPagesEditSlotHelper {
  /**
   * Render `DocumentPagesEditBox` plus its own page-level Save button and (once a save has
   * failed) the pages-save-failed alert.
   *
   * @param {object} box - `DocumentPagesEditBox` wiring.
   * @param {string} [box.gameSlug] - Game slug, forwarded to `DocumentPagesEditBox`.
   * @param {number|string} [box.id] - `GameDocument` id, forwarded to `DocumentPagesEditBox`.
   * @param {boolean} [box.canEditPages] - Whether the current user may edit this document's
   *   pages, also gating the Save button — there is no separate general "edit" permission for
   *   documents.
   * @param {React.Ref} [box.pagesRef] - Imperative handle ref for `DocumentPagesEditBox`.
   * @param {object} save - Save wiring.
   * @param {string} save.saveStatus - `'idle'`, `'saving'`, or `'failed'`.
   * @param {Function} save.onSave - Handler for the Save button.
   * @param {Function} save.onRetrySave - Handler for the failure alert's Retry action.
   * @param {Function} save.onSkipSave - Handler for the failure alert's Skip action.
   * @returns {React.ReactElement} The rendered pages-edit slot.
   */
  static render(box, save) {
    return (
      <>
        <DocumentPagesEditBox
          ref={box.pagesRef}
          gameSlug={box.gameSlug}
          id={box.id}
          canEditPages={box.canEditPages}
        />
        {DocumentPagesEditSlotHelper.#renderSaveButton(box.canEditPages, save.saveStatus, save.onSave)}
        {DocumentPagesEditSlotHelper.#renderPagesSaveFailedAlert(
          save.saveStatus, save.onRetrySave, save.onSkipSave,
        )}
      </>
    );
  }

  static #renderSaveButton(canEditPages, saveStatus, onSave) {
    if (!canEditPages) {
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
}
