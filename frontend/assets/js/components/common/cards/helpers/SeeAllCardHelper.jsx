import React from 'react';
import CardHoverTooltip from '../CardHoverTooltip.jsx';

/**
 * Rendering helper for the SeeAllCard element.
 */
export default class SeeAllCardHelper {
  /**
   * Render the "see all" grid-cell card, matching the photo-only layout of
   * `CharacterPreviewCardHelper`/`TreasurePreviewCardHelper`, with `text`
   * shown as a hover tooltip instead of always-visible text.
   *
   * @param {string} icon - Bootstrap icon class name (see `Icons.js`).
   * @param {string} text - Tooltip text shown on hover (e.g. "See all Treasures").
   * @param {string} href - Hash href for the full list page.
   * @returns {React.ReactElement} See-all card element.
   */
  static render(icon, text, href) {
    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <CardHoverTooltip content={text}>
          <a href={href} className="text-decoration-none text-dark">
            <div className="card h-100">
              <div className="card-photo-square d-flex align-items-center justify-content-center bg-light">
                <i className={`bi ${icon} fs-1 text-muted`} aria-hidden="true"></i>
              </div>
            </div>
          </a>
        </CardHoverTooltip>
      </div>
    );
  }
}
