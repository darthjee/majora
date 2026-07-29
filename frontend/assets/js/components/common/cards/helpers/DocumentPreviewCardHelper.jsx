import React from 'react';
import CardDocumentImage from '../CardDocumentImage.jsx';
import CardHoverTooltip from '../CardHoverTooltip.jsx';

/**
 * Rendering helper for the DocumentPreviewCard element.
 */
export default class DocumentPreviewCardHelper {
  /**
   * Render a read-only grid-cell card showing a document's photo, matching
   * `ItemPreviewCard`'s layout, with the document's name shown on hover. When `href` is given,
   * the whole card links to it (the document's own detail page, issue #892), matching
   * `ItemPreviewCardHelper`'s behavior.
   *
   * @param {object} document - CharacterDocument preview data object.
   * @param {string} document.name - Document name.
   * @param {string|null} [document.photo_path] - Optional document photo path.
   * @param {string} [href] - Optional hash href the whole card links to.
   * @returns {React.ReactElement} Document preview card element.
   */
  static render(document, href) {
    const card = (
      <div className="card h-100">
        <CardDocumentImage url={document.photo_path} alt={document.name} />
      </div>
    );

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <CardHoverTooltip content={document.name}>
          {DocumentPreviewCardHelper.#wrapWithLink(card, href)}
        </CardHoverTooltip>
      </div>
    );
  }

  static #wrapWithLink(card, href) {
    if (!href) {
      return card;
    }

    return (
      <a href={href} className="text-decoration-none text-dark">
        {card}
      </a>
    );
  }
}
