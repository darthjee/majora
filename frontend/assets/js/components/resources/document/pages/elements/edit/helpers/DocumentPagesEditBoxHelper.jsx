import React from 'react';
import MarkdownEditor from '../../../../../../common/forms/MarkdownEditor.jsx';
import PagesSplitter from '../../../../../../../utils/PagesSplitter.js';
import Translator from '../../../../../../../i18n/Translator.js';

/**
 * Rendering helper for the DocumentPagesEditBox element (issue #1129).
 */
export default class DocumentPagesEditBoxHelper {
  /**
   * Render either the "Edit" affordance (default, read-only state) or the full pages editor
   * (once edit mode has been entered), depending on `state.editMode`.
   *
   * @param {{editMode: boolean, loading: boolean, value: string}} state - Current box state.
   * @param {boolean} canEditPages - Whether the current user may edit this document's pages —
   *   the "Edit" affordance renders only when true; `null` is returned instead when false and no
   *   edit is already in progress.
   * @param {{onEdit: Function, onCancel: Function, onChange: Function}} handlers - Event handlers.
   * @returns {React.ReactElement|null} Rendered pages editor, or `null`.
   */
  static render(state, canEditPages, handlers) {
    if (!state.editMode) {
      return canEditPages ? DocumentPagesEditBoxHelper.#renderEditAffordance(state, handlers) : null;
    }

    return DocumentPagesEditBoxHelper.#renderEditor(state, handlers);
  }

  static #renderEditAffordance(state, handlers) {
    return (
      <div className="mt-4">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handlers.onEdit}
          disabled={state.loading}
        >
          {Translator.t('document_edit_page.edit_pages')}
        </button>
      </div>
    );
  }

  static #renderEditor(state, handlers) {
    return (
      <div className="mt-4">
        <div className="d-flex justify-content-end mb-1">
          <span className="text-muted">
            {Translator.t('document_edit_page.pages_count')
              .replace('{{count}}', DocumentPagesEditBoxHelper.#pageCount(state.value))}
          </span>
        </div>
        <MarkdownEditor
          id="document-pages-edit"
          label={Translator.t('document_page.pages_title')}
          value={state.value}
          onChange={handlers.onChange}
        />
        <button type="button" className="btn btn-secondary" onClick={handlers.onCancel}>
          {Translator.t('document_edit_page.cancel')}
        </button>
      </div>
    );
  }

  static #pageCount(value) {
    if (!value || value.trim().length === 0) {
      return 0;
    }

    return Math.max(1, Math.ceil(value.length / PagesSplitter.BUDGET));
  }
}
