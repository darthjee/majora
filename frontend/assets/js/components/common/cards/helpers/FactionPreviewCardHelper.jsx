import React from 'react';
import CardFactionImage from '../CardFactionImage.jsx';
import CardHoverTooltip from '../CardHoverTooltip.jsx';

/**
 * Rendering helper for the FactionPreviewCard element (issue #943), mirroring
 * `PossessionPreviewCardHelper`'s shape exactly.
 */
export default class FactionPreviewCardHelper {
  /**
   * Render a read-only grid-cell card showing a faction's photo, matching
   * `PossessionPreviewCard`'s layout, with the faction's name shown on hover. When `href` is
   * given, the whole card links to it.
   *
   * @param {object} faction - `CharacterFaction` preview data object.
   * @param {string} faction.name - Faction name.
   * @param {string|null} [faction.photo_path] - Optional faction photo path.
   * @param {string} [href] - Optional hash href the whole card links to.
   * @returns {React.ReactElement} Faction preview card element.
   */
  static render(faction, href) {
    const card = (
      <div className="card h-100">
        <CardFactionImage url={faction.photo_path} alt={faction.name} />
      </div>
    );

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <CardHoverTooltip content={faction.name}>
          {FactionPreviewCardHelper.#wrapWithLink(card, href)}
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
