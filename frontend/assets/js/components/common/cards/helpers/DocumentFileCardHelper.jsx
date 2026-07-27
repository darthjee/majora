import React from 'react';
import CardFileImage from '../CardFileImage.jsx';
import CardHoverTooltip from '../CardHoverTooltip.jsx';

/**
 * Rendering helper for the DocumentFileCard element.
 */
export default class DocumentFileCardHelper {
  /**
   * Render a grid-cell card showing a file's photo (or the default file placeholder), matching
   * `ItemPreviewCard`'s layout, with the file's name shown on hover. The whole card is a plain
   * `<a download>` link to the file's own path, so clicking it downloads the file instead of
   * navigating the SPA away (issue #873).
   *
   * @param {object} file - `GameDocumentFile` data object.
   * @param {string} file.name - File name, shown as the hover tooltip content.
   * @param {string} file.path - File storage path, used as the download link target.
   * @param {string|null} [file.photo_path] - Optional file photo path.
   * @returns {React.ReactElement} Document file card element.
   */
  static render(file) {
    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <CardHoverTooltip content={file.name}>
          <a href={file.path} download className="text-decoration-none text-dark">
            <div className="card h-100">
              <CardFileImage url={file.photo_path} alt={file.name} />
            </div>
          </a>
        </CardHoverTooltip>
      </div>
    );
  }
}
