import React from 'react';
import CardPhoto from '../CardPhoto.jsx';

/**
 * Rendering helper for the GameCard element.
 */
export default class GameCardHelper {
  /**
   * Render a Bootstrap card for a game.
   *
   * @param {object} game - Game data object.
   * @param {string} game.name - Game name.
   * @param {string} game.game_slug - Slug used for the detail link.
   * @param {string|null} [game.cover_photo_path] - Optional cover photo URL.
   * @returns {React.ReactElement} Game card element.
   */
  static render(game) {
    return (
      <div className="col-sm-6 col-md-4 col-lg-3 mb-4">
        <a href={`#/games/${game.game_slug}`} className="text-decoration-none text-dark">
          <div className="card h-100">
            <CardPhoto url={game.cover_photo_path} alt={game.name} />
            <div className="card-body">
              <h5 className="card-title">{game.name}</h5>
            </div>
          </div>
        </a>
      </div>
    );
  }
}
