import React from 'react';

/**
 * Rendering helper for the SeeAllCard element.
 */
export default class SeeAllCardHelper {
  /**
   * Render the "see all" grid-cell card.
   *
   * @param {string} icon - Bootstrap icon class name (see `Icons.js`).
   * @param {string} text - Card text (e.g. "See all Treasures").
   * @param {string} href - Hash href for the full list page.
   * @returns {React.ReactElement} See-all card element.
   */
  static render(icon, text, href) {
    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <div className="card h-100 position-relative">
          <div className="card-photo-square d-flex align-items-center justify-content-center bg-light">
            <i className={`bi ${icon} fs-1 text-muted`} aria-hidden="true"></i>
          </div>
          <div className="card-body">
            <a
              href={href}
              className="stretched-link text-decoration-none text-dark"
              aria-label={text}
            ></a>
          </div>
        </div>
      </div>
    );
  }
}
