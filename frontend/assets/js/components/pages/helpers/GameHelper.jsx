import React from 'react';
import CardPhoto from '../../elements/CardPhoto.jsx';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import GameNavLinks from '../../elements/GameNavLinks.jsx';
import LoadingMessage from '../../elements/LoadingMessage.jsx';

/**
 * Rendering helper for the Game detail page.
 */
export default class GameHelper {
  /**
   * Render the game detail view with description and navigation links.
   *
   * @param {object} game - Game data object.
   * @param {string} game.name - Game name.
   * @param {string} game.game_slug - Game slug.
   * @param {string|null} [game.photo] - Optional cover image URL.
   * @param {string} [game.description] - Game description text.
   * @returns {React.ReactElement} Game detail element.
   */
  static render(game) {
    return (
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-4">
            <CardPhoto url={game.photo} alt={game.name} />
          </div>
          <div className="col-md-8">
            <h1>{game.name}</h1>
            {game.description && (
              <p className="mt-3">{game.description}</p>
            )}
            <GameNavLinks gameSlug={game.game_slug} />
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message="Loading game..." />;
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return <ErrorAlert error={error} />;
  }
}
