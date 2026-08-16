import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import Pagination from '../../../../../../common/pagination/Pagination.jsx';
import EditButton from '../../../../../../common/buttons/EditButton.jsx';
import ConditionalComponent from '../../../../../../common/misc/ConditionalComponent.jsx';
import Translator from '../../../../../../../i18n/Translator.js';

const MAX_BOX_HEIGHT = 480;

/**
 * Rendering helper for the DocumentPagesBox element (issue #1126, edit entry point added in
 * #1129).
 */
export default class DocumentPagesBoxHelper {
  /**
   * Render the bordered, own-scroll pages box plus its pagination controls and (when
   * `canEditPages` is true) an "Edit pages" link to the document's edit page — the box's second,
   * scrolled-down-convenience entry point into pages editing (see the issue's "Edit entry point"
   * section). Renders just that same edit link, with nothing else, when no segment has loaded yet
   * (including a document with zero pages) and the caller can edit; returns `null` only when
   * there is truly nothing to show (no segments *and* no edit permission) — mirrors
   * `DescriptionBoxHelper`'s own null-when-empty precedent otherwise, though unlike
   * `DescriptionBox`'s collapse-on-overflow behavior, this box always keeps its own fixed-height
   * scroll.
   *
   * @param {{segments: object[], totalPages: number, currentPage: number}} state - Current box
   *   state (`segments`: ordered, loaded `GameDocumentPage`s; see `DocumentPagesBoxController`).
   * @param {{boxRef: object, bottomSentinelRef: object, registerSegmentRef: Function}} refs -
   *   Scroll container ref, bottom sentinel ref, and a callback ref registrar for each rendered
   *   segment, wired up by the `IntersectionObserver`s owned by the `DocumentPagesBox` component.
   * @param {string} gameSlug - Game slug, used to build the pagination links' base path and the
   *   edit link's href.
   * @param {number|string} id - `GameDocument` id, used to build the pagination links' base path
   *   and the edit link's href.
   * @param {boolean} [canEditPages] - Whether the current user may edit this document's pages
   *   (issue #1129), gating the "Edit pages" link. Defaults to `false`.
   * @returns {React.ReactElement|null} Rendered pages box, or `null`.
   */
  static render(state, refs, gameSlug, id, canEditPages = false) {
    const editHref = `#/games/${gameSlug}/documents/${id}/edit`;

    if (state.segments.length === 0) {
      return canEditPages ? DocumentPagesBoxHelper.#renderEditLink(editHref) : null;
    }

    return (
      <div className="mt-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2>{Translator.t('document_page.pages_title')}</h2>
          <ConditionalComponent render={canEditPages}>
            {DocumentPagesBoxHelper.#renderEditLink(editHref)}
          </ConditionalComponent>
        </div>
        <div
          ref={refs.boxRef}
          className="document-pages-box-content p-3 border rounded bg-light"
          style={{ overflowY: 'auto', maxHeight: MAX_BOX_HEIGHT }}
        >
          {state.segments.map((segment) => DocumentPagesBoxHelper.#renderSegment(segment, refs.registerSegmentRef))}
          <div ref={refs.bottomSentinelRef} />
        </div>
        <Pagination
          currentPage={state.currentPage}
          totalPages={state.totalPages}
          perPage={1}
          basePath={`#/games/${gameSlug}/documents/${id}`}
        />
      </div>
    );
  }

  static #renderEditLink(editHref) {
    return (
      <EditButton href={editHref}>
        {Translator.t('document_page.edit_pages_link')}
      </EditButton>
    );
  }

  static #renderSegment(segment, registerSegmentRef) {
    return (
      <div
        key={segment.id}
        ref={(element) => registerSegmentRef(segment.order, element)}
        data-page={segment.order}
      >
        <ReactMarkdown remarkPlugins={[remarkBreaks]}>{segment.content}</ReactMarkdown>
      </div>
    );
  }
}
