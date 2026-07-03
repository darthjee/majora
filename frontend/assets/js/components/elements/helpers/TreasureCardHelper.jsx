import React from 'react';
import CardTreasureImage from '../CardTreasureImage.jsx';

/**
 * Rendering helper for the TreasureCard element.
 */
export default class TreasureCardHelper {
  /**
   * Render a Bootstrap card for a treasure.
   *
   * @param {object} treasure - Treasure data object.
   * @param {number} treasure.id - Treasure ID.
   * @param {string} treasure.name - Treasure name.
   * @param {number} treasure.value - Treasure value.
   * @returns {React.ReactElement} Treasure card element.
   */
  static render(treasure) {
    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <a href={`#/treasures/${treasure.id}`} className="text-decoration-none text-dark">
          <div className="card h-100">
            <CardTreasureImage alt={treasure.name} />
            <div className="card-body">
              <h6 className="card-title">{treasure.name}</h6>
              <p className="card-text text-muted mb-0">{treasure.value}</p>
            </div>
          </div>
        </a>
      </div>
    );
  }
}
