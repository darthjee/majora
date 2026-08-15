import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import Pagination from '../../../../../../common/pagination/Pagination.jsx';
import Translator from '../../../../../../../i18n/Translator.js';

const MAX_BOX_HEIGHT = 480;

/**
 * Rendering helper for the DocumentPagesBox element (issue #1126).
 */
export default class DocumentPagesBoxHelper {
  /**
   * Render the bordered, own-scroll pages box plus its pagination controls, or `null` when no
   * segment has been loaded yet (including a document with zero pages) — mirrors
   * `DescriptionBoxHelper`'s own null-when-empty precedent, though unlike `DescriptionBox`'s
   * collapse-on-overflow behavior, this box always keeps its own fixed-height scroll.
   *
   * @param {{segments: object[], totalPages: number, currentPage: number}} state - Current box
   *   state (`segments`: ordered, loaded `GameDocumentPage`s; see `DocumentPagesBoxController`).
   * @param {{boxRef: object, bottomSentinelRef: object, registerSegmentRef: Function}} refs -
   *   Scroll container ref, bottom sentinel ref, and a callback ref registrar for each rendered
   *   segment, wired up by the `IntersectionObserver`s owned by the `DocumentPagesBox` component.
   * @param {string} gameSlug - Game slug, used to build the pagination links' base path.
   * @param {number|string} id - `GameDocument` id, used to build the pagination links' base path.
   * @returns {React.ReactElement|null} Rendered pages box, or `null`.
   */
  static render(state, refs, gameSlug, id) {
    if (state.segments.length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <h2>{Translator.t('document_page.pages_title')}</h2>
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
