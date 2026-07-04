import React from 'react';
import PhotoUploadOverlay from '../PhotoUploadOverlay.jsx';

/**
 * Rendering helper for the TreasureCard element.
 */
export default class TreasureCardHelper {
  /**
   * Render a Bootstrap card for a treasure.
   *
   * @description The card body's title uses Bootstrap's `stretched-link`
   *   utility (rather than wrapping the whole card in an anchor) so the
   *   superuser-only upload button can live alongside it without nesting an
   *   interactive `<button>` inside an interactive `<a>`.
   * @param {object} treasure - Treasure data object.
   * @param {number} treasure.id - Treasure ID.
   * @param {string} treasure.name - Treasure name.
   * @param {number} treasure.value - Treasure value.
   * @param {string|null} [treasure.photo_path] - Optional treasure photo path.
   * @param {boolean} [isSuperUser] - Whether the current user may upload a photo.
   * @param {Function} [onUploadClick] - Handler invoked with the treasure when the upload button is clicked.
   * @returns {React.ReactElement} Treasure card element.
   */
  static render(treasure, isSuperUser = false, onUploadClick = () => {}) {
    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <div className="card h-100 position-relative">
          <PhotoUploadOverlay
            type="treasure"
            url={treasure.photo_path}
            alt={treasure.name}
            canEdit={isSuperUser}
            onClick={() => onUploadClick(treasure)}
          />
          <div className="card-body">
            <h6 className="card-title">
              <a
                href={`#/treasures/${treasure.id}`}
                className="stretched-link text-decoration-none text-dark"
              >
                {treasure.name}
              </a>
            </h6>
            <p className="card-text text-muted mb-0">{treasure.value}</p>
          </div>
        </div>
      </div>
    );
  }
}
