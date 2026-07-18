import React from 'react';
import CardTreasureImage from '../CardTreasureImage.jsx';
import CardHoverTooltip from '../CardHoverTooltip.jsx';
import TreasureMoney from '../../misc/TreasureMoney.jsx';

/**
 * Rendering helper for the TreasurePreviewCard element.
 */
export default class TreasurePreviewCardHelper {
  /**
   * Render a read-only grid-cell card showing a treasure's photo, matching
   * `SeeAllCard`'s layout, with the whole card linking to the treasure's
   * detail page and its name/value shown on hover.
   *
   * @param {object} treasure - Treasure data object.
   * @param {number} treasure.id - Treasure ID.
   * @param {string} treasure.name - Treasure name.
   * @param {number} treasure.value - Treasure value.
   * @param {string} [treasure.game_type] - Currency model name (e.g. `dnd`, `deadlands`)
   *   determining which denominations the value is displayed in. Defaults to `dnd`.
   * @param {string|null} [treasure.photo_path] - Optional treasure photo path.
   * @param {number|null} [quantity] - Owned quantity, appended to the tooltip content as a
   *   `×<quantity>` suffix when greater than 1.
   * @returns {React.ReactElement} Treasure preview card element.
   */
  static render(treasure, quantity = null) {
    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <CardHoverTooltip content={TreasurePreviewCardHelper.#buildTooltipContent(treasure, quantity)}>
          <a
            href={`#/treasures/${treasure.id}`}
            className="text-decoration-none text-dark"
          >
            <div className="card h-100">
              <CardTreasureImage url={treasure.photo_path} alt={treasure.name} />
            </div>
          </a>
        </CardHoverTooltip>
      </div>
    );
  }

  static #buildTooltipContent(treasure, quantity) {
    return (
      <>
        {treasure.name}
        {quantity > 1 ? ` ×${quantity}` : ''}
        <br />
        <TreasureMoney value={treasure.value} gameType={treasure.game_type} />
      </>
    );
  }
}
