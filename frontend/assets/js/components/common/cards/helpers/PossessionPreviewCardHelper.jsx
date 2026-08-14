import React from 'react';
import CardPossessionImage from '../CardPossessionImage.jsx';
import CardHoverTooltip from '../CardHoverTooltip.jsx';

/**
 * Rendering helper for the PossessionPreviewCard element.
 */
export default class PossessionPreviewCardHelper {
  /**
   * Render a read-only grid-cell card showing a possession's photo, matching
   * `ItemPreviewCard`'s layout, with the possession's name shown on hover. When `href` is given,
   * the whole card links to it (the possession's own detail page), matching
   * `ItemPreviewCardHelper`'s behavior.
   *
   * @param {object} possession - CharacterPossession preview data object.
   * @param {string} possession.name - Possession name.
   * @param {string|null} [possession.photo_path] - Optional possession photo path.
   * @param {string} [href] - Optional hash href the whole card links to.
   * @returns {React.ReactElement} Possession preview card element.
   */
  static render(possession, href) {
    const card = (
      <div className="card h-100">
        <CardPossessionImage url={possession.photo_path} alt={possession.name} />
      </div>
    );

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <CardHoverTooltip content={possession.name}>
          {PossessionPreviewCardHelper.#wrapWithLink(card, href)}
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
