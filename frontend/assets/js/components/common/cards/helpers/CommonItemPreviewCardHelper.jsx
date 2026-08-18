import React from 'react';
import CardCommonItemImage from '../CardCommonItemImage.jsx';
import CardHoverTooltip from '../CardHoverTooltip.jsx';

/**
 * Rendering helper for the CommonItemPreviewCard element.
 */
export default class CommonItemPreviewCardHelper {
  /**
   * Render a read-only grid-cell card showing a common item's photo, matching
   * `PossessionPreviewCard`'s layout, with the common item's name shown on hover. When `href` is
   * given, the whole card links to it (the common item's own detail page), matching
   * `PossessionPreviewCardHelper`'s behavior.
   *
   * @param {object} commonItem - `GameCommonItem` preview data object.
   * @param {string} commonItem.name - Common item name.
   * @param {string|null} [commonItem.photo_path] - Optional common item photo path.
   * @param {string} [href] - Optional hash href the whole card links to.
   * @returns {React.ReactElement} Common item preview card element.
   */
  static render(commonItem, href) {
    const card = (
      <div className="card h-100">
        <CardCommonItemImage url={commonItem.photo_path} alt={commonItem.name} />
      </div>
    );

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <CardHoverTooltip content={commonItem.name}>
          {CommonItemPreviewCardHelper.#wrapWithLink(card, href)}
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
