import React from 'react';
import CardItemImage from '../CardItemImage.jsx';
import CardHoverTooltip from '../CardHoverTooltip.jsx';

/**
 * Rendering helper for the ItemPreviewCard element.
 */
export default class ItemPreviewCardHelper {
  /**
   * Render a read-only grid-cell card showing an item's photo, matching
   * `TreasurePreviewCard`'s layout, with the item's name shown on hover.
   * The card is not a link, since items have no standalone detail page
   * in scope.
   *
   * @param {object} item - CharacterItem preview data object.
   * @param {string} item.name - Item name.
   * @param {string} [item.description] - Item description.
   * @param {string|null} [item.photo_path] - Optional item photo path.
   * @returns {React.ReactElement} Item preview card element.
   */
  static render(item) {
    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <CardHoverTooltip content={item.name}>
          <div className="card h-100">
            <CardItemImage url={item.photo_path} alt={item.name} />
          </div>
        </CardHoverTooltip>
      </div>
    );
  }
}
