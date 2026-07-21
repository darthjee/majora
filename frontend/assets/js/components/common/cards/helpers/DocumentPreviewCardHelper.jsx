import React from 'react';
import CardDocumentImage from '../CardDocumentImage.jsx';
import CardHoverTooltip from '../CardHoverTooltip.jsx';

/**
 * Rendering helper for the DocumentPreviewCard element.
 */
export default class DocumentPreviewCardHelper {
  /**
   * Render a read-only grid-cell card showing a document's photo, matching
   * `ItemPreviewCard`'s layout, with the document's name shown on hover. The card is not
   * a link, since documents have no standalone detail page in scope (issue #725).
   *
   * @param {object} document - CharacterDocument preview data object.
   * @param {string} document.name - Document name.
   * @param {string|null} [document.photo_path] - Optional document photo path.
   * @returns {React.ReactElement} Document preview card element.
   */
  static render(document) {
    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <CardHoverTooltip content={document.name}>
          <div className="card h-100">
            <CardDocumentImage url={document.photo_path} alt={document.name} />
          </div>
        </CardHoverTooltip>
      </div>
    );
  }
}
