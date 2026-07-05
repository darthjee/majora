import React from 'react';
import PhotoUploadOverlay from '../PhotoUploadOverlay.jsx';
import Translator from '../../../i18n/Translator.js';
import Noop from '../../../utils/Noop.js';

/**
 * Rendering helper for the TreasureCard element.
 */
export default class TreasureCardHelper {
  /**
   * Render a Bootstrap card for a treasure.
   *
   * @description The card body's title uses Bootstrap's `stretched-link`
   *   utility (rather than wrapping the whole card in an anchor) so the
   *   manage-only upload button and edit link can live alongside it without
   *   nesting interactive elements inside an interactive `<a>`.
   * @param {object} treasure - Treasure data object.
   * @param {number} treasure.id - Treasure ID.
   * @param {string} treasure.name - Treasure name.
   * @param {number} treasure.value - Treasure value.
   * @param {string|null} [treasure.photo_path] - Optional treasure photo path.
   * @param {boolean} [canManage] - Whether the current user may upload a photo and edit this treasure.
   * @param {Function} [onUploadClick] - Handler invoked with the treasure when the upload button is clicked.
   * @param {string} [editHref] - Hash path to the treasure's edit page. When omitted, no edit
   *   link is rendered even if `canManage` is true.
   * @returns {React.ReactElement} Treasure card element.
   */
  static render(treasure, canManage = false, onUploadClick = Noop.noop, editHref = '') {
    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <div className="card h-100 position-relative">
          <PhotoUploadOverlay
            type="treasure"
            url={treasure.photo_path}
            alt={treasure.name}
            canEdit={canManage}
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
            {TreasureCardHelper.#renderEditLink(canManage, editHref)}
          </div>
        </div>
      </div>
    );
  }

  static #renderEditLink(canManage, editHref) {
    if (!canManage || !editHref) {
      return null;
    }

    return (
      <a
        href={editHref}
        className="card-action-link btn btn-sm btn-outline-secondary mt-2"
      >
        {Translator.t('game_treasures_page.edit')}
      </a>
    );
  }
}
