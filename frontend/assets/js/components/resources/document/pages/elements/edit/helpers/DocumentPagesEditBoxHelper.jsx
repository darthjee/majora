import React from 'react';
import MarkdownEditor from '../../../../../../common/forms/MarkdownEditor.jsx';
import PagesSplitter, { PAGE_WARNING_THRESHOLD } from '../../../../../../../utils/PagesSplitter.js';
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
   * @param {string} gameSlug - Game slug the document belongs to, used to link the counter to
   *   the document's show page (issue #1138) once past the warning threshold.
   * @param {number|string} id - `GameDocument` id, used for the same link.
   * @returns {React.ReactElement|null} Rendered pages editor, or `null`.
   */
  static render(state, canEditPages, handlers, gameSlug, id) {
    if (!state.editMode) {
      return canEditPages ? DocumentPagesEditBoxHelper.#renderEditAffordance(state, handlers) : null;
    }

    return DocumentPagesEditBoxHelper.#renderEditor(state, handlers, gameSlug, id);
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

  static #renderEditor(state, handlers, gameSlug, id) {
    const pageCount = DocumentPagesEditBoxHelper.#pageCount(state.value);

    return (
      <div className="mt-4">
        <div className="d-flex justify-content-end mb-1">
          {DocumentPagesEditBoxHelper.#renderPageCount(pageCount, gameSlug, id)}
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

  static #renderPageCount(pageCount, gameSlug, id) {
    const label = Translator.t('document_edit_page.pages_count').replace('{{count}}', pageCount);

    if (pageCount < PAGE_WARNING_THRESHOLD) {
      return <span className="text-muted">{label}</span>;
    }

    const hint = Translator.t('document_edit_page.pages_count_warning_hint');

    return (
      <a
        href={`#/games/${gameSlug}/documents/${id}`}
        className="text-warning fw-bold"
        title={hint}
        aria-label={hint}
      >
        {label}
      </a>
    );
  }

  static #pageCount(value) {
    if (!value || value.trim().length === 0) {
      return 0;
    }

    return Math.max(1, Math.ceil(value.length / PagesSplitter.BUDGET));
  }
}
